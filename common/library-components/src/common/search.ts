import { Index, Document } from "flexsearch";
import { keys, get, set, createStore, UseStore, clear } from "idb-keyval";

import { Article, ArticleText, RuntimeReplicache } from "../store";

export interface SearchResult {
    id: string;
    sentences: string[];
    main_sentence: number | null;
    score?: number;
    article?: Article;
}

export class SearchIndex {
    private isLoaded = false;
    private index = new Document({
        document: {
            id: "id",
            index: ["paragraph", "title"],
            store: ["articleId", "paragraph"],
        },
        // cache: true,
        optimize: true,
        charset: "latin:advanced",
        tokenize: "forward",
        context: {
            resolution: 5,
            depth: 3,
            bidirectional: true,
        },
        // worker: true,
    });
    private indexVersion = 1;

    async initialize(): Promise<boolean> {
        if (this.isLoaded) {
            return false;
        }

        const indexStore = createStore("flexsearch-index", "keyval");

        const savedIndexVersion = await get("indexVersion", indexStore);
        const savedKeys = await keys(indexStore);
        if (savedIndexVersion < this.indexVersion || savedKeys.length === 0) {
            // need to create new index from current data
            await clear(indexStore);

            this.isLoaded = true;
            return true;
        } else {
            // load saved index
            const start = performance.now();
            await Promise.all(
                savedKeys.map(async (key: string) => {
                    this.index.import(key, await get(key, indexStore));
                })
            );
            const duration = performance.now() - start;
            console.log(`Loaded search index in ${duration}ms`);

            this.isLoaded = true;
            return false;
        }
    }

    async addToSearchIndex(articleTexts: ArticleText[]) {
        const indexStore = createStore("flexsearch-index", "keyval");
        if (articleTexts.length === 0) {
            return;
        }

        const start = performance.now();
        await Promise.all(
            articleTexts.map(async (doc, docIndex) => {
                // using numeric ids reduces memory usage significantly
                // 0.1% collision chance for 10k articles
                // allows up to 300 paragraphs per article
                const articleId =
                    Math.floor(Math.random() * 1000 * 10000) * 300;

                await Promise.all(
                    doc.paragraphs
                        .slice(0, 300)
                        .map((paragraph, paragraphIndex) =>
                            this.index.addAsync(articleId + paragraphIndex, {
                                articleId: doc.id,
                                title: doc.title || "",
                                paragraph,
                            })
                        )
                );

                await set(doc.id, articleId, indexStore);
            })
        );

        const duration = performance.now() - start;
        const paragraphCount = articleTexts.reduce((acc, article) => {
            return acc + article.paragraphs.length;
        }, 0);
        console.log(
            `Indexed ${paragraphCount} paragraphs across ${articleTexts.length} documents in ${duration}ms`
        );

        await this.saveIndex(indexStore);
    }

    async removeFromSearchIndex(articleTexts: ArticleText[]) {
        const indexStore = createStore("flexsearch-index", "keyval");
        if (articleTexts.length === 0) {
            return;
        }

        await Promise.all(
            articleTexts.map(async (doc) => {
                const articleId = await get<number>(doc.id, indexStore);
                if (articleId === undefined) {
                    return;
                }

                await Promise.all(
                    doc.paragraphs.map((paragraph, paragraphIndex) =>
                        this.index.removeAsync(articleId + paragraphIndex)
                    )
                );
            })
        );
    }

    private async saveIndex(indexStore: UseStore) {
        const start = performance.now();

        await this.index.export(async (key: string, data: string) => {
            await set(key, data, indexStore);
        });
        await set("indexVersion", this.indexVersion, indexStore);

        const duration = performance.now() - start;
        console.log(`Saved search index in ${duration}ms`);
    }

    async search(query: string): Promise<SearchResult[]> {
        // search index
        let start = performance.now();
        const results = await this.index.searchAsync(query, {
            enrich: true,
        });
        let duration = performance.now() - start;
        // console.log(`Searched for "${query}" in ${duration}ms`);

        if (!results || results.length === 0) {
            return [];
        }

        // parse data schema
        const paragraphHits = results[0].result.map((item) => ({
            // @ts-ignore
            id: item.doc.articleId,
            // @ts-ignore
            sentences: [item.doc.paragraph],
            main_sentence: null,
        }));

        // take top result per article
        const seenArticles = new Set<string>();
        let articleHits: SearchResult[] = paragraphHits.filter((hit) => {
            if (seenArticles.has(hit.id)) {
                return false;
            }
            seenArticles.add(hit.id);

            return true;
        });

        // split sentences
        start = performance.now();
        articleHits = articleHits.map((hit) => {
            const sentences = splitSentences(hit.sentences[0]);
            if (sentences.length <= 1) {
                return hit;
            }

            // search for sentence with highest search score
            const sentenceIndex = new Index({
                preset: "score",
                charset: "latin:advanced",
                context: {
                    resolution: 5,
                    depth: 3,
                    bidirectional: true,
                },
            });
            sentences.map((sentence, index) =>
                sentenceIndex.add(index, sentence)
            );
            const relevanceOrder = sentenceIndex.search(query);

            return {
                ...hit,
                sentences: sentences,
                main_sentence: relevanceOrder[0] || 0,
            } as SearchResult;
        });
        duration = performance.now() - start;
        // console.log(`Detected main sentences in ${duration}ms`);

        return articleHits;
    }
}

// init the search index and watch replicache changes
export async function syncSearchIndex(
    rep: RuntimeReplicache,
    searchIndex: SearchIndex
) {
    let searchIndexInitialized = false;

    // watch replicache changes
    let addedQueue: ArticleText[] = [];
    let removedQueue: ArticleText[] = [];
    rep.experimentalWatch(
        (diff) => {
            const added = diff
                .filter((op) => op.op === "add" || op.op === "change")
                .map((e: any) => e.newValue);
            const removed = diff
                .filter((op) => op.op === "del")
                .map((e: any) => e.oldValue);

            if (!searchIndexInitialized) {
                addedQueue.push(...added);
                removedQueue.push(...removed);
            } else {
                searchIndex.addToSearchIndex(added);
                searchIndex.removeFromSearchIndex(removed);
            }
        },
        {
            prefix: "text/",
            initialValuesInFirstDiff: false,
        }
    );

    // load index or create new one
    const isEmpty: boolean = await searchIndex.initialize();

    // backfill entries
    if (isEmpty) {
        // backfill all current enties
        const articleTexts = await rep.query.listArticleTexts();
        await searchIndex.addToSearchIndex(articleTexts);
    } else {
        // backfill changes during initialization
        searchIndex.addToSearchIndex(addedQueue);
        searchIndex.removeFromSearchIndex(removedQueue);
    }

    searchIndexInitialized = true;
}

// from https://github.com/NaturalNode/natural
function splitSentences(text: string): string[] {
    let tokens = text.match(
        /(?<=\s+|^)["'‘“'"[({⟨]?(.*?[.?!])(\s[.?!])*["'’”'"\])}⟩]?(?=\s+|$)|(?<=\s+|^)\S(.*?[.?!])(\s[.?!])*(?=\s+|$)/g
    );
    if (!tokens) {
        return [text];
    }

    // remove unecessary white space
    tokens = tokens.map(Function.prototype.call, String.prototype.trim);
    return trim(tokens);
}
function trim(array) {
    while (array[array.length - 1] === "") {
        array.pop();
    }
    while (array[0] === "") {
        array.shift();
    }
    return array;
}
