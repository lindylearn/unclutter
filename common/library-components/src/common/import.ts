import asyncPool from "tiny-async-pool";

import { Annotation, Article, RuntimeReplicache } from "../store";
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
    // articles = articles.slice(0, 2);

    console.log(`Indexing ${articles.length} articles...`);
    onProgress?.({ targetArticles: articles.length });

    const user_id = "test-user7";

    // batch for resilience
    const start = performance.now();
    let articleCount = 0;
    let highlightCount = 0;
    for await (const newHighlights of asyncPool(concurrency, articles, (article) =>
        indexArticle(rep, user_id, article)
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

async function indexArticle(
    rep: RuntimeReplicache,
    user_id: string,
    article: Article
): Promise<number> {
    try {
        const highlights = await getTopArticleHighlights(article.url);
        if (!highlights || highlights.length === 0) {
            return 0;
        }

        await Promise.all(
            highlights.map((h, i) => {
                h.id = `ai_${article.id.slice(0, 20)}_${i}`;
                const annotation = topHighlightToAnnotation(h, article, undefined);
                return rep.mutate.putAnnotation(annotation);
            })
        );

        await indexAnnotationVectors(
            user_id,
            article.id,
            highlights.map((sentence) => sentence.sentence),
            highlights.map((sentence) => sentence.id),
            false
        );

        return highlights.length;
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

function topHighlightToAnnotation(
    sentence: RankedSentence,
    article: Article,
    quote_html_selector: any
): Annotation {
    return {
        id: sentence.id,
        article_id: article.id,
        quote_text: sentence.sentence,
        created_at: article.time_added,
        quote_html_selector,
        ai_created: true,
        ai_score: sentence.score,
    };
}

async function getTopArticleHighlights(
    url: string,
    scoreThreshold: number = 0.6
): Promise<RankedSentence[]> {
    const sentences = await getHeatmapRemote(url);
    return sentences
        ?.flatMap((paragraph) => paragraph)
        .filter((sentence) => sentence.score >= scoreThreshold);
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
