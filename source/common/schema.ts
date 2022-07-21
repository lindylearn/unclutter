export type LibraryInfo = {
    article: LibraryArticle;
    topic: LibraryTopic;
    sibling_count: number;
};

// imported from Unclutter Library src/store/_schema.ts
export type LibraryArticle = {
    title?: string | undefined;
    is_favorite?: boolean | undefined;
    url: string;
    word_count: number;
    time_added: number;
    reading_progress: number;
    topic_id: string;
    topic_sort_position: number;
    id: string;
};

export type LibraryTopic = {
    emoji?: string | undefined;
    parent_topic_id?: string | undefined;
    id: string;
    name: string;
};
