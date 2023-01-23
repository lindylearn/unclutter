import type {
    Article,
    ArticleLink,
    Topic,
    UserInfo,
    FeedSubscription,
} from "@unclutter/library-components/dist/store/_schema";
import type { ReadingProgress } from "@unclutter/library-components/dist/store/accessors";
import type { CustomGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";
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

    showFeed?: boolean;
    feed?: FeedSubscription;
};

// returned from API
export type LibraryInfo = {
    article: Article;
    topic?: Topic;

    new_links?: ArticleLink[];
};
