import {
    Article,
    ArticleLink,
    Topic,
} from "@unclutter/library-components/dist/store/_schema";
import { CustomGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
import { UserInfo } from "@unclutter/library-components/dist/store/user";

export type LibraryState = {
    libraryUser?: string;
    libraryInfo?: LibraryInfo;
    userInfo?: UserInfo;

    showLibrarySignup: boolean;

    isClustering: boolean;
    wasAlreadyPresent: boolean;
    error: boolean;
    justCompletedArticle: boolean;

    relatedArticles?: Article[];
    graph: CustomGraphData | null;
    topicProgress: TopicProgress | null;
};

// returned from API
export type LibraryInfo = {
    article: Article;
    topic: Topic | null;

    new_links?: ArticleLink[];
};

export type TopicProgress = {
    articleCount: number;
    completedCount: number;
    linkCount?: number;
};
