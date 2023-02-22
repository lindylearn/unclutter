import type { Annotation, Article } from "../../store";
import { debounce, groupBy } from "lodash";
import type { ReplicacheProxy } from "../replicache";
import {
    createHypothesisAnnotation,
    deleteHypothesisAnnotation,
    getHypothesisAnnotationsSince,
    updateHypothesisAnnotation,
} from "./hypothesis";

export async function downloadHypothesisAnnotations(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("hypothesis");
    if (!syncState) {
        return;
    }
    await rep.mutate.updateSyncState({ id: "hypothesis", is_syncing: true });

    const lastDownload = syncState.last_download ? new Date(syncState.last_download) : undefined;
    const newDownload = new Date(); // get last updated time before async fetching & uploading

    let [annotations, articles, newDownloadTimestamp] = await getHypothesisAnnotationsSince(
        syncState.username,
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
    }
    if (annotations?.length) {
        await rep.mutate.mergeRemoteAnnotations(annotations);
    }

    await rep.mutate.updateSyncState({
        id: "hypothesis",
        last_download: newDownload.getTime(),
        is_syncing: false,
    });
}

export async function uploadAnnotationsToHypothesis(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("hypothesis");
    if (!syncState) {
        return;
    }
    await rep.mutate.updateSyncState({ id: "hypothesis", is_syncing: true });

    const lastUpload = syncState.last_upload ? new Date(syncState.last_upload) : undefined;
    const newUpload = new Date(); // get before async fetching & uploading

    // filter annotations to upload
    let annotations = await rep.query.listAnnotations();
    const lastUploadUnix = lastUpload?.getTime() || 0;
    annotations = annotations
        .filter((a) => (a.updated_at || a.created_at) * 1000 > lastUploadUnix)
        .filter((a) => !a.ai_created || a.text);

    // short circuit if nothing to upload
    if (annotations.length === 0) {
        await rep.mutate.updateSyncState({
            id: "hypothesis",
            is_syncing: false,
            last_upload: newUpload.getTime(),
        });
        return;
    }

    console.log(
        `Uploading ${
            annotations.length
        } changed annotations since ${lastUpload?.toUTCString()} to hypothes.is`
    );

    // fetch articles
    const articleIds = Object.keys(groupBy(annotations, (a) => a.article_id));
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
    await Promise.all(
        annotations.map(async (annotation) => {
            const article = articleMap[annotation.article_id];

            if (annotation.h_id) {
                // already exists remotely
                return updateHypothesisAnnotation(
                    syncState.username,
                    syncState.api_token,
                    annotation
                );
            } else {
                // create remotely, then save id
                const remoteId = await createHypothesisAnnotation(
                    syncState.username,
                    syncState.api_token,
                    annotation,
                    article.url,
                    article.title || ""
                );
                await rep.mutate.updateAnnotation({
                    id: annotation.id,
                    h_id: remoteId,
                });
            }
        })
    );

    await rep.mutate.updateSyncState({
        id: "hypothesis",
        is_syncing: false,
        last_upload: newUpload.getTime(),
    });
}
const uploadAnnotationsToHypothesisDebounced = debounce(uploadAnnotationsToHypothesis, 10 * 1000);

// only handle deletes using store watch for reslience
let watchActive = false;
export async function watchLocalAnnotations(rep: ReplicacheProxy) {
    if (watchActive) {
        return;
    }
    watchActive = true;

    rep.watch("annotations/", async (changed: Annotation[], removed: Annotation[]) => {
        if (changed.length > 0) {
            // process based on edit timestamp for resilience
            uploadAnnotationsToHypothesisDebounced(rep);
        }
        if (removed.length > 0) {
            console.log(`Deleting ${removed.length} annotations on hypothesis`);
            const syncState = await rep.query.getSyncState("hypothesis");
            if (!syncState) {
                return;
            }
            await Promise.all(
                removed.map((annotation) =>
                    deleteHypothesisAnnotation(syncState.username, syncState.api_token, annotation)
                )
            );
        }
    });
}
