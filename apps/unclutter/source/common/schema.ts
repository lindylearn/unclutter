import {
    Article,
    ArticleLink,
    Topic,
    UserInfo,
} from "@unclutter/library-components/dist/store/_schema";
import { ReadingProgress } from "@unclutter/library-components/dist/store/accessors";
import { CustomGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";

export type LibraryState = {
    libraryEnabled: boolean;

    libraryInfo?: LibraryInfo;
    userInfo?: UserInfo;

    showLibrarySignup: boolean;

    isClustering: boolean;
    wasAlreadyPresent: boolean;
    error: boolean;
    justCompletedArticle: boolean;

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
