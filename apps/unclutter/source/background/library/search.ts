import { Article, getAnnotation, getArticle } from "@unclutter/library-components/dist/store";
import {
    SearchIndex,
    SearchResult,
    syncSearchIndex,
} from "@unclutter/library-components/dist/common";
import { rep } from "./replicache";

let searchIndex: SearchIndex = null;
export async function initSearchIndex() {
    if (searchIndex) {
        return;
    }
    console.log("Initializing library search index...");

    searchIndex = new SearchIndex();
    // @ts-ignore
    await syncSearchIndex(rep, searchIndex as unknown as SearchIndex, false, true);
}

export async function search(query: string): Promise<(SearchResult & { article: Article })[]> {
    if (!searchIndex) {
        return;
    }

    const results = await searchIndex.search(query, false, false);

    const resultsWithArticles = await Promise.all(
        results.map(async (hit) => {
            const annotation = await rep.query((tx) => getAnnotation(tx, hit.id));
            const article = await rep.query((tx) => getArticle(tx, annotation?.article_id));
            return {
                ...hit,
                annotation,
                article,
            };
        })
    );
    return resultsWithArticles.filter((hit) => hit.annotation !== undefined);
}
