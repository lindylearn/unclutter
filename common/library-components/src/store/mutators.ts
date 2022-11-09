import { JSONValue } from "replicache";
import { generate, Update } from "@rocicorp/rails";
import { WriteTransaction } from "replicache";
import sha256 from "crypto-js/sha256";

import {
    ArticleSortPosition,
    getSafeArticleSortPosition,
    getSettings,
    getUserInfo,
} from "./accessors";
import {
    annotationSchema,
    Article,
    ArticleLink,
    articleLinkSchema,
    articleSchema,
    ArticleText,
    articleTextSchema,
    feedSubscriptionSchema,
    readingProgressFullClamp,
    Settings,
    Topic,
    topicSchema,
    UserInfo,
} from "./_schema";

/* ***** articles & topics ***** */

const {
    get: getArticle,
    list: listArticles,
    put: putArticle,
    update: updateArticle,
    delete: deleteArticleRaw,
} = generate("articles", articleSchema);
const {
    put: putArticleText,
    update: updateArticleText,
    delete: deleteArticleText,
} = generate("text", articleTextSchema);
const { put: putArticleLink } = generate("link", articleLinkSchema);
const { put: putTopic, list: listTopics, delete: deleteTopic } = generate("topics", topicSchema);

async function putArticleIfNotExists(
    tx: WriteTransaction,
    article: Omit<Article, ArticleSortPosition>
) {
    const existing = await getArticle(tx, article.id);
    if (existing) {
        return;
    }

    // use time as sort position
    const fullArticle = article as Article;
    fullArticle.recency_sort_position = fullArticle.time_added * 1000;
    fullArticle.topic_sort_position = fullArticle.time_added * 1000;

    await putArticle(tx, fullArticle);
}

// batch large inserts to have fewer mutations to sync
async function importArticles(
    tx: WriteTransaction,
    {
        articles,
    }: {
        articles: Omit<Article, ArticleSortPosition>[];
    }
) {
    await Promise.all(
        articles.map(async (a) => {
            await putArticleIfNotExists(tx, a);
        })
    );
}
async function importArticleTexts(
    tx: WriteTransaction,
    {
        article_texts,
    }: {
        article_texts: ArticleText[];
    }
) {
    await Promise.all(
        article_texts.map(async (article_text) => {
            await putArticleText(tx, article_text);
        })
    );
}

async function importArticleLinks(
    tx: WriteTransaction,
    {
        links,
    }: {
        links: Omit<ArticleLink, "id">[];
    }
) {
    await Promise.all(
        links.map(async (link: ArticleLink) => {
            // use one entry for both directions
            const nodeIds = [link.source, link.target].sort();
            link.id = sha256(`${nodeIds.join("-")}-${link.type}`).toString();
            await putArticleLink(tx, link);
        })
    );
}

async function deleteArticle(tx: WriteTransaction, articleId: string) {
    await deleteArticleRaw(tx, articleId);
    await deleteArticleText(tx, articleId);
}

async function updateArticleReadingProgress(
    tx: WriteTransaction,
    { articleId, readingProgress }: { articleId: string; readingProgress: number }
) {
    const diff: Partial<Article> = {
        id: articleId,
        reading_progress: readingProgress,
    };
    // dequeue if completed article
    if (readingProgress >= readingProgressFullClamp) {
        diff.is_queued = false;
    }

    return updateArticle(tx, diff as Article);
}

async function articleSetFavorite(
    tx: WriteTransaction,
    { id, is_favorite }: { id: string; is_favorite: boolean }
) {
    let favorites_sort_position: number | null = null;
    if (is_favorite) {
        favorites_sort_position = new Date().getTime();
    }

    await updateArticle(tx, {
        id,
        is_favorite,
        favorites_sort_position,
    });
}

async function articleTrackOpened(tx: WriteTransaction, articleId: string) {
    const timeNow = new Date().getTime();
    await updateArticle(tx, {
        id: articleId,
        recency_sort_position: timeNow,
        topic_sort_position: timeNow,
        domain_sort_position: timeNow,
    });
}

// noted: this may be batched into multiple mutations in backend
async function updateAllTopics(
    tx: WriteTransaction,
    {
        newTopics,
        articleTopics,
        skip_topics_delete = false,
    }: {
        newTopics: Topic[];
        articleTopics: { [articleId: string]: string };
        skip_topics_delete?: boolean;
    }
) {
    // replace existing topic entries
    if (!skip_topics_delete) {
        const existingTopics = await listTopics(tx);
        await Promise.all(existingTopics.map((t) => deleteTopic(tx, t.id)));
    }
    await Promise.all(newTopics.map((t) => putTopic(tx, t)));

    // update article topic ids
    const articleTopicEntries = Object.entries(articleTopics);
    // read before write
    const existingArticles = await Promise.all(
        articleTopicEntries.map(([articleId, topicId]) => getArticle(tx, articleId))
    );
    await Promise.all(
        articleTopicEntries.map(async ([articleId, topicId], index) => {
            const existing = existingArticles[index];
            if (existing?.topic_id !== topicId) {
                console.log(`update ${existing?.topic_id} -> ${topicId}`);
                await updateArticle(tx, {
                    id: articleId,
                    topic_id: topicId,
                });
            }
        })
    );
}

async function moveArticlePosition(
    tx: WriteTransaction,
    {
        articleId,
        articleIdBeforeNewPosition,
        articleIdAfterNewPosition,
        sortPosition,
    }: {
        articleId: string;
        articleIdBeforeNewPosition: string | null;
        articleIdAfterNewPosition: string | null;
        sortPosition: ArticleSortPosition;
    }
) {
    const activeArticle = await getArticle(tx, articleId);
    const beforeArticle = articleIdBeforeNewPosition
        ? await getArticle(tx, articleIdBeforeNewPosition)
        : null;
    const afterArticle = articleIdAfterNewPosition
        ? await getArticle(tx, articleIdAfterNewPosition)
        : null;
    if (!activeArticle || (!beforeArticle && !afterArticle)) {
        return;
    }

    // higest indexes first
    let newUpperBound = beforeArticle && getSafeArticleSortPosition(beforeArticle, sortPosition);
    let newLowerBound = afterArticle && getSafeArticleSortPosition(afterArticle, sortPosition);
    // don't floor to 0 or present in case of reordering on sliced / filtered list
    if (!newUpperBound) {
        newUpperBound = newLowerBound! + 1000;
    } else if (!newLowerBound) {
        newLowerBound = newUpperBound - 1000;
    }

    // creates floats
    const newPosition = (newLowerBound! + newUpperBound!) / 2;

    await updateArticle(tx, {
        id: articleId,
        [sortPosition]: newPosition,
    });
}

// combine queue status update & move within a single mutation (to prevent UI flicker)
async function articleAddMoveToQueue(
    tx: WriteTransaction,
    {
        articleId,
        isQueued,
        articleIdBeforeNewPosition,
        articleIdAfterNewPosition,
        sortPosition,
    }: {
        articleId: string;
        isQueued: boolean;
        articleIdBeforeNewPosition: string | null;
        articleIdAfterNewPosition: string | null;
        sortPosition: ArticleSortPosition;
    }
) {
    const articleDiff: Partial<Article> = {
        id: articleId,
        is_queued: isQueued,
        queue_sort_position: isQueued ? new Date().getTime() : undefined,
    };
    if (isQueued) {
        // reset reading progress if completed article is queued
        const article = await getArticle(tx, articleId);
        if (article && article.reading_progress >= readingProgressFullClamp) {
            articleDiff.reading_progress = 0;
        }
    }

    await updateArticle(tx, articleDiff as Article);
    await moveArticlePosition(tx, {
        articleId,
        articleIdBeforeNewPosition,
        articleIdAfterNewPosition,
        sortPosition,
    });
}

/* ***** annotations ***** */

const {
    get: getAnnotation,
    list: listAnnotations,
    put: putAnnotation,
    update: updateAnnotation,
    delete: deleteAnnotation,
} = generate("annotations", annotationSchema);

/* ***** settings & useInfo ***** */

export async function updateSettings(tx: WriteTransaction, diff: Partial<Settings>) {
    const savedValue = await getSettings(tx);
    await tx.put("settings", { ...savedValue, ...diff });
}

export async function updateUserInfo(tx: WriteTransaction, diff: Partial<UserInfo>) {
    const savedValue = await getUserInfo(tx);
    await tx.put("userInfo", { ...(savedValue || {}), ...diff });
}

export async function importEntries(tx: WriteTransaction, entries: [string, JSONValue][]) {
    await Promise.all(entries.map(([key, value]) => tx.put(key, value)));
}

/* ***** FeedSubscription ***** */

const {
    get: getSubscription,
    put: putSubscription,
    update: updateSubscription,
    delete: deleteSubscription,
} = generate("subscription", feedSubscriptionSchema);

async function toggleSubscriptionActive(tx: WriteTransaction, subscriptionId: string) {
    const subscription = await getSubscription(tx, subscriptionId);
    if (!subscription) {
        return;
    }

    await updateSubscription(tx, {
        id: subscriptionId,
        is_subscribed: !subscription.is_subscribed,
        last_fetched: Math.round(new Date().getTime() / 1000), // check for new articles starting now
    });
}

export const mutators = {
    updateArticle,
    articleSetFavorite,
    articleTrackOpened,
    deleteArticle,
    updateArticleReadingProgress,
    putArticleIfNotExists,
    importArticles,
    importArticleTexts,
    importArticleLinks,
    putTopic,
    updateAllTopics,
    moveArticlePosition,
    articleAddMoveToQueue,
    putAnnotation,
    updateAnnotation,
    deleteAnnotation,
    updateSettings,
    importEntries,
    updateUserInfo,
    putSubscription,
    updateSubscription,
    toggleSubscriptionActive,
    deleteSubscription,
};
export type M = typeof mutators;
export type ArticleUpdate = Update<Article>;
