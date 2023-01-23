import asyncPool from "tiny-async-pool";

import { Annotation, Article, RuntimeReplicache, UserInfo } from "../store";
import { indexAnnotationVectors } from "./api";

export interface ImportProgress {
    finished?: boolean;

    currentArticles?: number;
    targetArticles: number;

    currentHighlights?: number;
}

export async function backfillLibraryAnnotations(
    rep: RuntimeReplicache,
    userInfo: UserInfo,
    onProgress?: (progress: ImportProgress) => void,
    concurrency: number = 5
) {
    const annotations = await rep.query.listAnnotations();
    const articlesWithAIAnnotations = new Set(
        annotations.filter((a) => a.ai_created).map((a) => a.article_id)
    );

    let articles = await rep.query.listArticles();
    articles = articles
        .filter((a) => !articlesWithAIAnnotations.has(a.id))
        .sort((a, b) => b.time_added - a.time_added);

    console.log(`Backfilling AI annotations for ${articles.length} articles...`);
    onProgress?.({ targetArticles: articles.length });

    // batch for resilience
    const start = performance.now();
    let articleCount = 0;
    let highlightCount = 0;
    for await (const newHighlights of asyncPool(concurrency, articles, (article) =>
        indexArticle(rep, userInfo.id, article)
    )) {
        articleCount += 1;
        highlightCount += newHighlights;

        console.log(`${articleCount}/${articles.length}`);
        onProgress?.({
            currentArticles: articleCount,
            targetArticles: articles.length,
            currentHighlights: highlightCount,
        });
    }

    onProgress?.({
        currentArticles: articleCount,
        targetArticles: articles.length,
        currentHighlights: highlightCount,
        finished: true,
    });

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
        const annotations = await generateAnnotationsRemote(article.url, article.id);

        await Promise.all(annotations.map((a) => rep.mutate.putAnnotation(a)));
        await indexAnnotationVectors(
            user_id,
            article.id,
            annotations.map((a) => a.quote_text!),
            annotations.map((a) => a.id),
            false
        );

        return annotations.length;
    } catch (err) {
        console.error(err);
        return 0;
    }
}

async function generateAnnotationsRemote(
    url: string,
    article_id: string,
    score_threshold: number = 0.6
): Promise<Annotation[]> {
    const response = await fetch("https://serverless-import-jumq7esahq-ue.a.run.app", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url,
            article_id,
            score_threshold,
        }),
    });
    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    return data.annotations || [];
}
