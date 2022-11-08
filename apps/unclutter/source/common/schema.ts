import {
    Article,
    ArticleLink,
    Topic,
    UserInfo,
    FeedSubscription,
} from "@unclutter/library-components/dist/store/_schema";
import { ReadingProgress } from "@unclutter/library-components/dist/store/accessors";
import { CustomGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
import { cleanTitle } from "@unclutter/library-components/dist/common/util";

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

    feed?: FeedSubscription;
};

// returned from API
export type LibraryInfo = {
    article: Article;
    topic?: Topic;

    new_links?: ArticleLink[];
};

export function constructLocalArticleInfo(
    articleUrl: string,
    articleId: string,
    articleTitle: string
): LibraryInfo {
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
