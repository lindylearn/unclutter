import { debounce, chunk } from "lodash";
import asyncPool from "tiny-async-pool";

import type { Annotation, Article, SyncState } from "../../store";
import type { ReplicacheProxy } from "../replicache";
import {
    createHypothesisAnnotation,
    deleteHypothesisAnnotation,
    getHypothesisAnnotationsSince,
    updateHypothesisAnnotation,
} from "./hypothesis";

export async function syncDownloadAnnotations(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("hypothesis");
    if (!syncState) {
        return;
    }
    await rep.mutate.updateSyncState({ id: "hypothesis", is_syncing: true });

    const lastDownload = syncState.last_download ? new Date(syncState.last_download) : undefined;
    const newDownload = new Date(); // get last updated time before async fetching & uploading

    let [annotations, articles, newDownloadTimestamp] = await getHypothesisAnnotationsSince(
        syncState.username!,
        syncState.api_token,
        lastDownload,
        10000
    );

    console.log(
        `Downloading ${
            annotations.length
        } hypothes.is annotations since ${lastDownload?.toUTCString()}`
    );
    if (articles?.length) {
        await rep.mutate.importArticles({ articles });

        if (articles.length >= 10) {
            // wait for replicache push to stay below vercel 4.5mb request limit
            await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
        }
    }
    if (annotations?.length) {
        // handles updating remote ids

        if (annotations.length >= 1000) {
            for (const annotationsChunk of chunk(annotations, 1000)) {
                await rep.mutate.mergeRemoteAnnotations(annotationsChunk);

                // wait for replicache push to stay below vercel 4.5mb request limit
                await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
            }
        } else {
            await rep.mutate.mergeRemoteAnnotations(annotations);
        }
    }

    await rep.mutate.updateSyncState({
        id: "hypothesis",
        last_download: newDownload.getTime(),
        is_syncing: false,
    });
}

export async function syncUploadAnnotations(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("hypothesis");
    if (!syncState) {
        return;
    }
    await rep.mutate.updateSyncState({ id: "hypothesis", is_syncing: true });

    const lastUpload = syncState.last_upload ? new Date(syncState.last_upload) : undefined;
    const newUpload = new Date(); // get before async fetching & uploading

    // filter annotations to upload
    let annotations = await rep.query.listAnnotations();
    const lastUploadUnixMillis = lastUpload?.getTime() || 0;
    annotations = annotations
        .filter((a) => (a.updated_at || a.created_at) > lastUploadUnixMillis / 1000)
        .filter((a) => !a.ai_created || a.text);

    // if the syncState got lost, we'd try to patch all previously uploaded annotations
    if (!lastUpload) {
        annotations = annotations.filter((a) => !a.h_id);
    }

    // short circuit if nothing to upload
    if (annotations.length === 0) {
        await rep.mutate.updateSyncState({
            id: "hypothesis",
            is_syncing: false,
            last_upload: newUpload.getTime(),
        });
        return;
    }

    const createdCount = annotations.filter((a) => !a.h_id).length;
    const updatedCount = annotations.filter((a) => a.h_id).length;
    console.log(
        `Uploading ${createdCount} new and ${updatedCount} updated annotations since ${lastUpload?.toUTCString()} to hypothes.is`
    );

    // fetch articles
    const articleIds = [...new Set(annotations.map((a) => a.article_id))];
    const articles = await Promise.all(
        articleIds.map((articleId) => rep.query.getArticle(articleId))
    );
    const articleMap: { [articleId: string]: Article } = articles.reduce((acc, article) => {
        if (article) {
            acc[article.id] = article;
        }
        return acc;
    }, {});

    // upload changes
    for await (const _ of asyncPool(5, annotations, (annotation) =>
        uploadAnnotation(rep, syncState, annotation, articleMap[annotation.article_id])
    )) {
        // TODO add progress indication?
    }

    await rep.mutate.updateSyncState({
        id: "hypothesis",
        is_syncing: false,
        last_upload: newUpload.getTime(),
    });
}

async function uploadAnnotation(
    rep: ReplicacheProxy,
    syncState: SyncState,
    annotation: Annotation,
    article: Article | undefined
) {
    if (!article) {
        return;
    }

    try {
        if (annotation.h_id) {
            // already exists remotely
            await updateHypothesisAnnotation(syncState.username!, syncState.api_token, annotation);
        } else {
            // create remotely, then save id
            const remoteId = await createHypothesisAnnotation(
                syncState.username!,
                syncState.api_token,
                annotation,
                article.url,
                article.title || ""
            );
            // don't change updated_at
            await rep.mutate.updateAnnotationRaw({
                id: annotation.id,
                h_id: remoteId,
            });
        }
    } catch (err) {
        console.error(err);
    }
}

const syncUploadAnnotationsDebounced = debounce(syncUploadAnnotations, 10 * 1000);

// only handle deletes using store watch for reslience
let watchActive = false;
export async function syncWatchAnnotations(rep: ReplicacheProxy) {
    if (watchActive) {
        return;
    }
    watchActive = true;

    console.log("Watching annotations for changes...");
    rep.watch("annotations/", async (changed: Annotation[], removed: Annotation[]) => {
        if (changed.length > 0) {
            // process based on edit timestamp for resilience
            syncUploadAnnotationsDebounced(rep);
        }

        removed = removed.filter((a) => a.h_id);
        if (removed.length > 0) {
            console.log(`Deleting ${removed.length} annotations on hypothesis`);
            const syncState = await rep.query.getSyncState("hypothesis");
            if (!syncState) {
                return;
            }
            await Promise.all(
                removed.map((annotation) =>
                    deleteHypothesisAnnotation(syncState.username!, syncState.api_token, annotation)
                )
            );
        }
    });
}
