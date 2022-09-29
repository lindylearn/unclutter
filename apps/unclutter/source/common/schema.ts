import {
    Article,
    ArticleLink,
    Topic,
} from "@unclutter/library-components/dist/store/_schema";
import { CustomGraphData } from "@unclutter/library-components/dist/components/Modal/Graph";

export type LibraryState = {
    libraryUser?: string;
    libraryInfo?: LibraryInfo;

    showLibrarySignup: boolean;

    isClustering: boolean;
    wasAlreadyPresent: boolean;
    error: boolean;

    relatedArticles?: Article[];
    graph: CustomGraphData;
};

// returned from API
export type LibraryInfo = {
    article: Article;
    topic: Topic | null;
    sibling_count: number;

    new_links?: ArticleLink[];
};
