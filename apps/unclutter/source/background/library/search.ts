import { Article } from "@unclutter/library-components/dist/store";
import {
    SearchIndex,
    SearchResult,
    syncSearchIndex,
} from "@unclutter/library-components/dist/common";
import { rep } from "./library";

let searchIndex: SearchIndex = null;
export async function initSearchIndex() {
    if (searchIndex) {
        return;
    }
    console.log("Initializing library search index...");

    try {
        searchIndex = new SearchIndex();
        await syncSearchIndex(rep, searchIndex as unknown as SearchIndex, false, true);
    } catch (err) {
        console.error(err);
        searchIndex = null;
    }
}

export async function search(query: string): Promise<(SearchResult & { article: Article })[]> {
    if (!searchIndex) {
        return;
    }

    const results = await searchIndex.search(query, true, false);

    const resultsWithArticles = await Promise.all(
        results.map(async (hit) => {
            const annotation = await rep.query.getAnnotation(hit.id);
            const article = await rep.query.getArticle(annotation?.article_id);
            return {
                ...hit,
                annotation,
                article,
            };
        })
    );
    return resultsWithArticles.filter((hit) => hit.annotation !== undefined);
}
