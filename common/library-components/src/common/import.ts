import asyncPool from "tiny-async-pool";

import { Article, RuntimeReplicache } from "../store";
import { indexAnnotationVectors } from "./api";

export interface ImportProgress {
    targetArticles: number;
    currentArticles?: number;
    currentHighlights?: number;
}

export async function indexLibraryArticles(
    rep: RuntimeReplicache,
    onProgress?: (progress: ImportProgress) => void,
    concurrency: number = 5
) {
    let articles = await rep.query.listArticles();
    articles.sort((a, b) => b.time_added - a.time_added);
    // articles = articles.slice(0, 5);

    console.log(`Indexing ${articles.length} articles...`);
    onProgress?.({ targetArticles: articles.length });

    const user_id = "test-user5";

    // batch for resilience
    const start = performance.now();
    let articleCount = 0;
    let highlightCount = 0;
    for await (const newHighlights of asyncPool(concurrency, articles, (article) =>
        indexArticle(user_id, article)
    )) {
        articleCount += 1;
        highlightCount += newHighlights;

        console.log(`${articleCount}/${articles.length}`);
        onProgress?.({
            targetArticles: articles.length,
            currentArticles: articleCount,
            currentHighlights: highlightCount,
        });
    }

    console.log(
        `Created ${highlightCount} highlights in ${Math.round(performance.now() - start)}ms.`
    );
}

async function indexArticle(user_id: string, article: Article): Promise<number> {
    try {
        const sentences = await createArticleSentences(article.url);
        if (!sentences) {
            return 0;
        }

        await indexAnnotationVectors(user_id, article.id, sentences, undefined, false);

        return sentences.length;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

export interface RankedSentence {
    id: string;
    score: number;
    sentence: string;
}

async function createArticleSentences(
    url: string,
    scoreThreshold: number = 0.6
): Promise<string[]> {
    const sentences = await getHeatmapRemote(url);
    return sentences
        ?.flatMap((paragraph) => paragraph)
        .filter((sentence) => sentence.score >= scoreThreshold)
        .map((sentence) => sentence.sentence);
}

async function getHeatmapRemote(url: string): Promise<RankedSentence[][]> {
    const response = await fetch("https://serverless-import-jumq7esahq-ue.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url,
        }),
    });
    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    return data.sentences;
}
