import asyncPool from "tiny-async-pool";
// import chunk from "lodash/chunk";
import type { ArticleImportSchema } from "../components";

import { Annotation, Article, RuntimeReplicache, UserInfo } from "../store";
import { createScreenshots, indexAnnotationVectors } from "./api";
import { getUrlHash } from "./url";
import { constructLocalArticle } from "./util";

export interface ImportProgress {
    finished?: boolean;

    currentArticles?: number;
    targetArticles: number;

    currentHighlights?: number;
}

export async function importArticles(
    rep: RuntimeReplicache,
    data: ArticleImportSchema,
    userInfo: UserInfo,
    onProgress?: (progress: ImportProgress) => void,
    concurrency: number = 5
) {
    const existingArticles = await rep.query.listArticles();
    const existingArticleIds = new Set(existingArticles.map((a) => a.id));
    data.urls = data.urls.filter((url) => !existingArticleIds.has(getUrlHash(url)));

    console.log(`Backfilling AI annotations for ${data.urls.length} articles...`);
    onProgress?.({ targetArticles: data.urls.length });

    // trigger screenshots in parallel
    createScreenshots(data.urls);

    // batch for resilience
    const start = performance.now();
    let articleCount = 0;
    let highlightCount = 0;
    for await (const newHighlights of asyncPool(concurrency, data.urls, (url, i) =>
        importArticle(
            rep,
            userInfo.id,
            url,
            data.time_added?.[i],
            data.status?.[i],
            data.favorite?.[i]
        )
    )) {
        articleCount += 1;
        highlightCount += newHighlights;
        onProgress?.({
            currentArticles: articleCount,
            targetArticles: data.urls.length,
            currentHighlights: highlightCount,
        });
    }

    onProgress?.({
        currentArticles: articleCount,
        targetArticles: data.urls.length,
        currentHighlights: highlightCount,
        finished: true,
    });

    console.log(
        `Imported ${data.urls.length} articles in ${Math.round(performance.now() - start)}ms.`
    );
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
        generateAnnotations(rep, userInfo.id, article)
    )) {
        articleCount += 1;
        highlightCount += newHighlights;
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
        `Backfilled ${highlightCount} highlights in ${Math.round(performance.now() - start)}ms.`
    );
}

async function importArticle(
    rep: RuntimeReplicache,
    user_id: string,
    url: string,
    time_added?: number,
    status?: number,
    favorite?: number
) {
    try {
        // filter out non-articles
        const urlObj = new URL(url);
        if (urlObj.pathname === "/") {
            return 0;
        }

        // generate heatmap and parse article metadata
        const article_id = getUrlHash(url);
        const { annotations, title, word_count } = await generateAnnotationsRemote(url, article_id);
        if (!word_count || word_count < 4 * 200) {
            return 0;
        }

        // save article
        const article = constructLocalArticle(url, article_id, title || "");
        article.time_added = time_added || 0;
        article.reading_progress = status || 0;
        article.is_favorite = favorite === 1;
        article.word_count = word_count || 0;
        // article.publication_date = ???
        await rep.mutate.putArticleIfNotExists(article);

        // save highlights
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

async function generateAnnotations(
    rep: RuntimeReplicache,
    user_id: string,
    article: Article
): Promise<number> {
    try {
        const { annotations } = await generateAnnotationsRemote(article.url, article.id);

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
): Promise<{ annotations: Annotation[]; title?: string; word_count?: number }> {
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
        return {
            annotations: [],
        };
    }

    const data = await response.json();
    return data || { annotations: [] };
}

// service already does this
// async function batchRemoteScreenshots(
//     urls: string[],
//     concurrency: number = 5,
//     batchSize: number = 1
// ) {
//     const batches = chunk(urls, batchSize);

//     for await (const batch of asyncPool(concurrency, batches, createScreenshots)) {
//         console.log("Screenshot batch done");
//     }
// }
