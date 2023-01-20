import { Index, Document } from "flexsearch";
import { keys, get, set, createStore, UseStore, clear } from "idb-keyval";

import { Annotation, Article } from "../store";
import { ReplicacheProxy } from "./replicache";
import { splitSentences } from "./util";

export interface SearchResult {
    id: string;
    sentences: string[];
    main_sentence: number | null;
    score?: number;

    // may be enriched by the caller
    article?: Article;
}

export class SearchIndex {
    private isLoaded = false;
    private index = new Document({
        document: {
            id: "id",
            index: ["paragraph", "title"],
            store: ["docId", "paragraph"],
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

    private idSuffix: string;
    constructor(idSuffix: string) {
        this.idSuffix = idSuffix;
    }

    private indexStore: UseStore;
    async initialize(forceReinit = false): Promise<boolean> {
        if (this.isLoaded) {
            return false;
        }

        this.indexStore = createStore(`flexsearch-index${this.idSuffix}`, "keyval");

        const savedIndexVersion = await get("indexVersion", this.indexStore);
        const savedKeys = await keys(this.indexStore);
        if (forceReinit || savedIndexVersion < this.indexVersion || savedKeys.length === 0) {
            // need to create new index from current data
            await clear(this.indexStore);

            this.isLoaded = true;
            return true;
        } else {
            // load saved index
            const start = performance.now();
            await Promise.all(
                savedKeys.map(async (key: string) => {
                    const doc = await get(key, this.indexStore);

                    // storing other info in indexStore, so may throw
                    try {
                        await this.index.import(key, doc);
                    } catch {}
                })
            );
            const duration = Math.round(performance.now() - start);
            console.log(`Loaded search index with ${savedKeys.length} entries in ${duration}ms`);

            this.isLoaded = true;
            return false;
        }
    }

    async addAnnotations(annotations: Annotation[]) {
        if (!annotations?.length) {
            return;
        }

        const start = performance.now();
        await Promise.all(
            annotations.map(async (doc, docIndex) => {
                // using numeric ids reduces memory usage significantly
                // 0.1% collision chance for 10k articles
                // allows up to 30 annotations per article
                const numericDocId = Math.floor(Math.random() * 1000 * 10000) * 30;

                await this.index.addAsync(numericDocId, {
                    docId: doc.id,
                    paragraph: doc.quote_text,
                });
                if (doc.text) {
                    await this.index.addAsync(numericDocId + 1, {
                        docId: doc.id,
                        paragraph: doc.text,
                    });
                }

                await set(doc.id, numericDocId, this.indexStore);
            })
        );

        const duration = Math.round(performance.now() - start);
        console.log(`Indexed ${annotations.length} annotations in ${duration}ms`);

        // await this.saveIndex();
    }

    async removeAnnotations(annotations: Annotation[]) {
        if (!annotations?.length) {
            return;
        }

        await Promise.all(
            annotations.map(async (doc) => {
                const docId = await get<number>(doc.id, this.indexStore);
                if (docId === undefined) {
                    return;
                }

                await this.index.removeAsync(docId);
                await this.index.removeAsync(docId + 1);
            })
        );
    }

    private async saveIndex() {
        const start = performance.now();

        await this.index.export(async (key: string, data: string) => {
            await set(key, data, this.indexStore);
        });
        await set("indexVersion", this.indexVersion, this.indexStore);

        // const duration = Math.round(performance.now() - start);
        // console.log(`Saved search index in ${duration}ms`);
    }

    async search(
        query: string,
        combineResults = true,
        getMainSentence = true
    ): Promise<SearchResult[]> {
        // search index
        let start = performance.now();
        const results = await this.index.searchAsync(query, {
            enrich: true,
        });
        // const duration = Math.round(performance.now() - start);
        // console.log(`Searched for "${query}" in ${duration}ms`);

        if (!results || results.length === 0) {
            return [];
        }

        // parse data schema
        const paragraphHits = results[0].result
            .filter((item) => item.doc)
            .map((item) => ({
                // @ts-ignore
                id: item.doc.docId,
                // @ts-ignore
                sentences: [item.doc.paragraph],
                main_sentence: null,
            }));

        let articleHits: SearchResult[] = paragraphHits;
        if (combineResults) {
            // take only top result per id
            const seenDoc = new Set<string>();
            articleHits = articleHits.filter((hit) => {
                if (seenDoc.has(hit.id)) {
                    return false;
                }
                seenDoc.add(hit.id);

                return true;
            });
        }

        // split sentences
        if (getMainSentence) {
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
                sentences.map((sentence, index) => sentenceIndex.add(index, sentence));
                const relevanceOrder = sentenceIndex.search(query);

                return {
                    ...hit,
                    sentences: sentences,
                    main_sentence: relevanceOrder[0] || 0,
                } as SearchResult;
            });
            // const duration = Math.round(performance.now() - start);
            // console.log(`Detected main sentences in ${duration}ms`);
        }

        return articleHits;
    }
}

// init the search index and watch replicache changes
export async function syncSearchIndex(
    rep: ReplicacheProxy,
    searchIndex: SearchIndex,
    forceReinit = false
) {
    let searchIndexInitialized = false;

    // watch replicache changes
    let addedAnnotationsBuffer: Annotation[] = [];
    let removedAnnotationBuffer: Annotation[] = [];
    rep.watch("annotations/", (added: Annotation[], removed: Annotation[]) => {
        if (!searchIndexInitialized) {
            addedAnnotationsBuffer.push(...added);
            removedAnnotationBuffer.push(...removed);
        } else {
            searchIndex.addAnnotations(added);
            searchIndex.removeAnnotations(removed);
        }
    });

    // load index or create new one
    const isEmpty: boolean = await searchIndex.initialize(forceReinit);

    // backfill entries
    if (isEmpty) {
        // backfill all current enties

        const annotations = await rep.query.listAnnotations();
        await searchIndex.addAnnotations(annotations);
    } else {
        // backfill changes during initialization
        searchIndex.addAnnotations(addedAnnotationsBuffer);
        searchIndex.removeAnnotations(removedAnnotationBuffer);
    }

    searchIndexInitialized = true;
}
