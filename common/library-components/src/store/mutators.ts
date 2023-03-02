import { JSONValue } from "replicache";
import { generate, Update } from "@rocicorp/rails";
import { WriteTransaction } from "replicache";

import {
    ArticleSortPosition,
    getSafeArticleSortPosition,
    getSettings,
    getUserInfo,
    listArticleAnnotationsServer,
} from "./accessors";
import {
    Annotation,
    annotationSchema,
    Article,
    articleSchema,
    feedSubscriptionSchema,
    Settings,
    syncStateSchema,
    UserInfo,
} from "./_schema";
import { readingProgressFullClamp } from "./constants";

// replicache v12 doesn't support explicit undefined values
export function stripUndefined<T extends object>(obj: T): T {
    Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
    return obj;
}

/* ***** articles & topics ***** */

const {
    get: getArticle,
    list: listArticles,
    put: putArticle,
    update: updateArticleRaw,
    delete: deleteArticleRaw,
} = generate("articles", articleSchema);

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

    await putArticle(tx, stripUndefined(fullArticle));
}

async function updateArticle(tx: WriteTransaction, article: Partial<Article>) {
    await updateArticleRaw(tx, {
        ...stripUndefined(article),
        time_updated: Math.round(new Date().getTime() / 1000),
    } as Article);
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

async function deleteArticle(tx: WriteTransaction, articleId: string) {
    const articleAnnotations = await listArticleAnnotationsServer(tx, articleId);
    await Promise.all(articleAnnotations.map((a) => deleteAnnotation(tx, a.id)));

    await deleteArticleRaw(tx, articleId);
}

async function updateArticleReadingProgress(
    tx: WriteTransaction,
    { articleId, readingProgress }: { articleId: string; readingProgress: number }
) {
    const timeNow = new Date().getTime();
    const diff: Partial<Article> = {
        id: articleId,
        reading_progress: readingProgress,
        recency_sort_position: timeNow,
        topic_sort_position: timeNow,
        domain_sort_position: timeNow,
    };
    // dequeue if completed article
    if (readingProgress >= readingProgressFullClamp) {
        diff.is_queued = false;
        diff.is_new = false;
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
    };
    if (isQueued) {
        articleDiff["queue_sort_position"] = new Date().getTime();

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

async function articleAddMoveToLibrary(
    tx: WriteTransaction,
    {
        temporaryArticle,
        articleIdBeforeNewPosition,
        articleIdAfterNewPosition,
        sortPosition,
    }: {
        temporaryArticle: Article;
        articleIdBeforeNewPosition: string | null;
        articleIdAfterNewPosition: string | null;
        sortPosition: ArticleSortPosition;
    }
) {
    await putArticleIfNotExists(tx, {
        ...temporaryArticle,
        is_temporary: false,
        is_new: false,
        time_added: Math.round(new Date().getTime() / 1000),
        // keep description to avoid display changes
    });
    await moveArticlePosition(tx, {
        articleId: temporaryArticle.id,
        articleIdBeforeNewPosition,
        articleIdAfterNewPosition,
        sortPosition,
    });
}

/* ***** annotations ***** */

const {
    get: getAnnotation,
    list: listAnnotations,
    put: putAnnotationRaw,
    update: updateAnnotationRaw,
    delete: deleteAnnotation,
} = generate("annotations", annotationSchema);

async function putAnnotation(tx: WriteTransaction, annotation: Annotation) {
    await putAnnotationRaw(tx, {
        ...stripUndefined(annotation),
        updated_at: annotation.updated_at || annotation.created_at,
    });
}

async function mergeRemoteAnnotations(tx: WriteTransaction, annotations: Annotation[]) {
    const allAnnotations = await listAnnotations(tx);

    await Promise.all(
        annotations.map(async (annotation) => {
            let existing: Annotation | undefined;
            if (annotation.h_id) {
                existing = allAnnotations.find((a) => a.h_id === annotation.h_id);
                if (existing) {
                    annotation = { ...annotation, id: existing.id };
                }
            } else {
                existing = allAnnotations.find((a) => a.id === annotation.id);
            }

            if (!existing) {
                await putAnnotation(tx, annotation);
                return;
            }

            // setting .h_id will trigger another PATCH request
            // this is ok for manually created annotations, but not for all existing
            await updateAnnotationRaw(tx, stripUndefined(annotation));
        })
    );
}

async function updateAnnotation(tx: WriteTransaction, annotation: Partial<Annotation>) {
    await updateAnnotationRaw(tx, {
        ...stripUndefined(annotation),
        updated_at: Math.round(new Date().getTime() / 1000),
    } as Annotation);
}

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

/* ***** sync state ***** */
const {
    get: getSyncState,
    put: putSyncState,
    update: updateSyncState,
    delete: deleteSyncState,
} = generate("sync", syncStateSchema);

export const mutators = {
    updateArticle,
    updateArticleRaw,
    articleSetFavorite,
    articleTrackOpened,
    deleteArticle,
    updateArticleReadingProgress,
    putArticleIfNotExists,
    importArticles,
    moveArticlePosition,
    articleAddMoveToQueue,
    articleAddMoveToLibrary,
    putAnnotation,
    mergeRemoteAnnotations,
    updateAnnotation,
    updateAnnotationRaw,
    deleteAnnotation,
    updateSettings,
    importEntries,
    updateUserInfo,
    putSubscription,
    updateSubscription,
    toggleSubscriptionActive,
    deleteSubscription,
    getSyncState,
    putSyncState,
    updateSyncState,
    deleteSyncState,
};
export type M = typeof mutators;
export type ArticleUpdate = Update<Article>;
