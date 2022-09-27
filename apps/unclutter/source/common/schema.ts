import type { GraphData } from "force-graph";
import {
    Article,
    Topic,
    ArticleLink,
} from "@unclutter/library-components/dist/store/_schema";

export type LibraryState = {
    libraryUser?: string;
    libraryInfo?: LibraryInfo;

    showLibrarySignup: boolean;

    isClustering: boolean;
    wasAlreadyPresent: boolean;
    error: boolean;

    relatedArticles?: Article[];
    graph: GraphData;
};

// returned from API
export type LibraryInfo = {
    article: Article;
    topic: Topic | null;
    sibling_count: number;
};
