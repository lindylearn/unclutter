import {
    Article,
    ArticleLink,
    Topic,
    UserInfo,
} from "@unclutter/library-components/dist/store/_schema";
import { ReadingProgress } from "@unclutter/library-components/dist/store/accessors";
import { CustomGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common";
import { cleanTitle } from "../overlay/outline/components/parse";
import { addArticleToLibrary } from "./api";

export type LibraryState = {
    libraryEnabled: boolean;

    libraryInfo?: LibraryInfo;
    userInfo?: UserInfo;

    showLibrarySignup: boolean;

    isClustering: boolean;
    wasAlreadyPresent: boolean;
    error: boolean;

    relatedArticles?: Article[];
    graph?: CustomGraphData;
    linkCount?: number;
    readingProgress?: ReadingProgress;
};

// returned from API
export type LibraryInfo = {
    article: Article;
    topic?: Topic;

    new_links?: ArticleLink[];
};

export async function constructArticleInfo(
    articleUrl: string,
    articleId: string,
    articleTitle: string,
    userInfo: UserInfo | undefined
): Promise<LibraryInfo> {
    if (userInfo?.onPaidPlan || userInfo?.trialEnabled) {
        // fetch state remotely
        // TODO remove mutate in backend? just fetch topic?
        return await addArticleToLibrary(articleUrl, userInfo?.id);
    } else {
        return {
            article: {
                id: articleId,
                url: articleUrl,
                title: cleanTitle(articleTitle),
                word_count: 0, // TODO how to get this in frontend?
                publication_date: null, // TODO how to get this in frontend?
                time_added: Math.round(new Date().getTime() / 1000),
                reading_progress: 0.0,
                topic_id: null,
                is_favorite: false,
            },
        };
    }
}

export async function saveArticleInfo(rep: ReplicacheProxy, libraryInfo: LibraryInfo) {
    if (libraryInfo.topic) {
        await rep.mutate.putTopic(libraryInfo.topic);
    }
    await rep.mutate.putArticleIfNotExists(libraryInfo.article);
    if (libraryInfo.new_links) {
        await rep.mutate.importArticleLinks({
            links: libraryInfo.new_links,
        });
    }
}
