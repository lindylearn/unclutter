import asyncPool from "tiny-async-pool";
import chunk from "lodash/chunk";
import type { ArticleImportSchema } from "../components";

import type { Annotation, Article, RuntimeReplicache, UserInfo } from "../store";
import { createScreenshots, generateAnnotationsRemote, indexAnnotationVectors } from "./api";
import { getUrlHash } from "./url";
import { constructLocalArticle } from "./util";

export interface ImportProgress {
    finished?: boolean;
    customMessage?: string;

    currentArticles?: number;
    targetArticles: number;

    currentHighlights?: number;
}

export async function importArticles(
    rep: RuntimeReplicache,
    data: ArticleImportSchema,
    userInfo: UserInfo,
    onProgress?: (progress: ImportProgress) => void,
    concurrency: number = 10
) {
    // filter all columns
    let dataRows = data.urls.map((url, i) => ({
        url,
        time_added: data.time_added?.[i] || 0,
        status: data.status?.[i],
        favorite: data.favorite?.[i],
    }));

    const existingArticles = await rep.query.listArticles();
    const existingArticleIds = new Set(existingArticles.map((a) => a.id));
    dataRows = dataRows.filter((row) => !existingArticleIds.has(getUrlHash(row.url)));
    dataRows.sort((a, b) => b.time_added - a.time_added);

    console.log(`Backfilling AI annotations for ${dataRows.length} articles...`);
    onProgress?.({ targetArticles: dataRows.length });

    // trigger screenshots in parallel
    batchRemoteScreenshots(
        dataRows.map((r) => r.url),
        concurrency
    );

    // batch for resilience
    const start = performance.now();
    let articleCount = 0;
    let highlightCount = 0;
    for await (const newHighlights of asyncPool(concurrency, dataRows, (row) =>
        importArticle(rep, userInfo.id, row.url, row.time_added, row.status, row.favorite)
    )) {
        articleCount += 1;
        highlightCount += newHighlights;
        onProgress?.({
            currentArticles: articleCount,
            targetArticles: dataRows.length,
            currentHighlights: highlightCount,
        });
    }

    onProgress?.({
        currentArticles: articleCount,
        targetArticles: dataRows.length,
        currentHighlights: highlightCount,
        finished: true,
    });

    console.log(
        `Imported ${dataRows.length} articles in ${Math.round(performance.now() - start)}ms.`
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

// service already does this
async function batchRemoteScreenshots(
    urls: string[],
    concurrency: number = 10,
    batchSize: number = 10
) {
    const batches = chunk(urls, batchSize);

    for await (const batch of asyncPool(concurrency, batches, (batch) =>
        createScreenshots(batch, true)
    )) {
        console.log("Screenshot batch done");
    }
}
