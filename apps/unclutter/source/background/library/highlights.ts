import type { Annotation, Article } from "@unclutter/library-components/dist/store";
import { debounce, groupBy } from "lodash";
import { getHypothesisUsername, getHypothesisToken } from "../../common/annotations/storage";
import { getFeatureFlag, hypothesisSyncFeatureFlag } from "../../common/featureFlags";
import { getHypothesisSyncState } from "../../common/storage";
import { rep } from "./library";
import {
    createHypothesisAnnotation,
    deleteHypothesisAnnotation,
    getHypothesisAnnotationsSince,
    updateHypothesisAnnotation,
} from "@unclutter/library-components/dist/common/sync/hypothesis";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";

export async function initHighlightsSync() {
    let syncState = await rep.query.getSyncState("hypothesis");

    // try migration from extension settings
    if (!syncState) {
        const hypothesisSyncEnabled = await getFeatureFlag(hypothesisSyncFeatureFlag);
        const username = await getHypothesisUsername();
        const api_token = await getHypothesisToken();
        if (!hypothesisSyncEnabled || !username || !api_token) {
            return;
        }

        console.log("Migrating legacy hypothesis sync state");
        const oldSyncState = await getHypothesisSyncState();
        syncState = {
            id: "hypothesis",
            username,
            api_token,
            last_download:
                oldSyncState?.lastDownloadTimestamp &&
                new Date(oldSyncState?.lastDownloadTimestamp).getTime(),
            last_upload:
                oldSyncState?.lastUploadTimestamp &&
                new Date(oldSyncState?.lastUploadTimestamp).getTime(),
        };
        await rep.mutate.putSyncState(syncState);

        // TODO delete after migration?
    }

    try {
        // upload before download to not endlessly loop
        await uploadAnnotationsToHypothesis(rep);
        await downloadHypothesisAnnotations(rep);

        await watchLocalAnnotations(rep);
    } catch (err) {
        console.error(err);
    }

    console.log("Annotations sync done");
}

export async function downloadHypothesisAnnotations(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("hypothesis");
    await rep.mutate.updateSyncState({ id: "hypothesis", is_syncing: true });

    const lastDownload = syncState.last_download && new Date(syncState.last_download);
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
        } hypothes.is annotations since ${lastDownload.toUTCString()}`
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

async function uploadAnnotationsToHypothesis(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("hypothesis");
    await rep.mutate.updateSyncState({ id: "hypothesis", is_syncing: true });

    const lastUpload = syncState.last_upload && new Date(syncState.last_upload);
    const newUpload = new Date(); // get before async fetching & uploading

    // filter annotations to upload
    let annotations = await rep.query.listAnnotations();
    const lastUploadUnix = lastUpload?.getTime() || 0;
    annotations = annotations
        .filter((a) => a.updated_at * 1000 > lastUploadUnix)
        .filter((a) => !a.ai_created || a.text)
        .sort((a, b) => a.updated_at - b.updated_at); // sort with oldest first

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
        } changed annotations since ${lastUpload.toUTCString()} to hypothes.is`
    );

    // fetch articles
    const articleIds = Object.keys(groupBy(annotations, (a) => a.article_id));
    const articles = await Promise.all(
        articleIds.map((articleId) => rep.query.getArticle(articleId))
    );
    const articleMap: { [articleId: string]: Article } = articles.reduce((acc, article) => {
        acc[article.id] = article;
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
                    article.title
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
async function watchLocalAnnotations(rep: ReplicacheProxy) {
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
            console.log(`Deleting ${removed.length} annotation remotely...`);
            const syncState = await rep.query.getSyncState("hypothesis");
            await Promise.all(
                removed.map((annotation) =>
                    deleteHypothesisAnnotation(syncState.username, syncState.api_token, annotation)
                )
            );
        }
    });
}
