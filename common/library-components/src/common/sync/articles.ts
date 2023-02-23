import { debounce, chunk } from "lodash";
import asyncPool from "tiny-async-pool";

import type { Article, SyncState } from "../../store";
import type { ReplicacheProxy } from "../replicache";
import { addUpdateArticles, deletePocketArticle, getPocketArticles } from "./pocket";

export async function syncDownloadArticles(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("pocket");
    if (!syncState) {
        return;
    }
    await rep.mutate.updateSyncState({ id: "pocket", is_syncing: true });

    const lastDownload = syncState.last_download ? new Date(syncState.last_download) : undefined;
    const newDownload = new Date(); // get last updated time before async fetching & uploading

    let articles = await getPocketArticles(syncState.api_token, lastDownload);
    if (articles === null) {
        return;
    }

    console.log(
        `Downloading ${articles?.length} pocket articles since ${lastDownload?.toUTCString()}`
    );
    if (articles?.length) {
        await rep.mutate.importArticles({ articles });
    }

    await rep.mutate.updateSyncState({
        id: "pocket",
        last_download: newDownload.getTime(),
        is_syncing: false,
    });
}

export async function syncUploadArticles(rep: ReplicacheProxy) {
    const syncState = await rep.query.getSyncState("pocket");
    if (!syncState) {
        return;
    }
    await rep.mutate.updateSyncState({ id: "pocket", is_syncing: true });

    const lastUpload = syncState.last_upload ? new Date(syncState.last_upload) : undefined;
    const newUpload = new Date(); // get before async fetching & uploading

    // filter annotations to upload
    const lastUploadUnixMillis = lastUpload?.getTime() || 0;
    let articles = await rep.query.listRecentArticles(lastUploadUnixMillis);

    // if the syncState got lost, we'd try to patch all previously uploaded annotations
    if (!lastUpload) {
        articles = articles.filter((a) => !a.pocket_id);
    }

    if (articles?.length) {
        console.log(
            `Uploading ${articles.length} articles since ${lastUpload?.toUTCString()} to Pocket`
        );
        // upload changes
        const remoteIds = await addUpdateArticles(syncState.api_token, articles);
        await Promise.all(
            remoteIds.map((remoteId, i) =>
                rep.mutate.updateArticleRaw({ id: articles[i].id, pocket_id: remoteId })
            )
        );
    }

    await rep.mutate.updateSyncState({
        id: "pocket",
        is_syncing: false,
        last_upload: newUpload.getTime(),
    });
}
const syncUploadArticlesDebounced = debounce(syncUploadArticles, 10 * 1000);

// only handle deletes using store watch for reslience
let watchActive = false;
export async function syncWatchArticles(rep: ReplicacheProxy) {
    if (watchActive) {
        return;
    }
    watchActive = true;

    console.log("Watching annotations for changes...");
    rep.watch("articles/", async (changed: Article[], removed: Article[]) => {
        if (changed.length > 0) {
            // process based on edit timestamp for resilience
            syncUploadArticlesDebounced(rep);
        }

        removed = removed.filter((a) => a.pocket_id);
        if (removed.length > 0) {
            console.log(`Deleting ${removed.length} articles on Pocket`);
            const syncState = await rep.query.getSyncState("pocket");
            if (!syncState) {
                return;
            }
            await Promise.all(
                removed.map((article) => deletePocketArticle(syncState.api_token, article))
            );
        }
    });
}
