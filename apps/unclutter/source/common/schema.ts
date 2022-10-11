import {
    Article,
    ArticleLink,
    Topic,
} from "@unclutter/library-components/dist/store/_schema";
import { CustomGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
import { UserInfo } from "@unclutter/library-components/dist/store/user";

export type LibraryState = {
    libraryEnabled: boolean;

    libraryUser?: string;
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

export type ReadingProgress = {
    articleCount: number;
    completedCount: number;
};
