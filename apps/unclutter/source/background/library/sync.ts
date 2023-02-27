import { getHypothesisUsername, getHypothesisToken } from "../../common/annotations/storage";
import { getFeatureFlag, hypothesisSyncFeatureFlag } from "../../common/featureFlags";
import { getHypothesisSyncState } from "../../common/storage";
import { rep } from "./library";
import {
    syncDownloadAnnotations,
    syncUploadAnnotations,
    syncWatchAnnotations,
} from "@unclutter/library-components/dist/common/sync/highlights";
import type { SyncState } from "@unclutter/library-components/dist/store";
import {
    syncDownloadArticles,
    syncUploadArticles,
    syncWatchArticles,
} from "@unclutter/library-components/dist/common/sync/articles";

let highlightsSyncActive = false;
export async function initHighlightsSync(setSyncState: SyncState = undefined) {
    if (highlightsSyncActive) {
        return;
    }
    highlightsSyncActive = true;

    let syncState = await rep.query.getSyncState("hypothesis");
    console.log("Starting highlights sync", syncState, setSyncState);

    if (!syncState && setSyncState && setSyncState.id === "hypothesis") {
        // in case not pulled yet
        syncState = setSyncState;
        await rep.mutate.putSyncState(syncState);
    }

    // try migration from extension settings
    if (!syncState) {
        const hypothesisSyncEnabled = await getFeatureFlag(hypothesisSyncFeatureFlag);
        const username = await getHypothesisUsername();
        const api_token = await getHypothesisToken();
        if (!hypothesisSyncEnabled || !username || !api_token) {
            highlightsSyncActive = false;
            return;
        }

        const oldSyncState = await getHypothesisSyncState();
        console.log("Migrating legacy hypothesis sync state", oldSyncState);
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
        await syncUploadAnnotations(rep);
        await syncDownloadAnnotations(rep);

        await syncWatchAnnotations(rep);
    } catch (err) {
        console.error(err);
    }

    console.log("Annotations sync done");
    highlightsSyncActive = false;
}

let articlesSyncActive = false;
export async function initArticlesSync(setSyncState: SyncState = undefined) {
    if (articlesSyncActive) {
        return;
    }
    articlesSyncActive = true;

    let syncState = await rep.query.getSyncState("pocket");
    console.log("Starting articles sync", syncState, setSyncState);

    if (!syncState && setSyncState && setSyncState.id === "pocket") {
        // in case not pulled yet
        syncState = setSyncState;
        await rep.mutate.putSyncState(syncState);
    }
    if (!syncState) {
        articlesSyncActive = false;
        return;
    }

    try {
        // upload before download to not endlessly loop
        await syncUploadArticles(rep);
        await syncDownloadArticles(rep);

        await syncWatchArticles(rep);
    } catch (err) {
        console.error(err);
    }

    console.log("Articles sync done");
    articlesSyncActive = false;
}

export async function syncPull() {
    try {
        if (!highlightsSyncActive) {
            highlightsSyncActive = true;
            await syncUploadAnnotations(rep);
        }
        if (!articlesSyncActive) {
            articlesSyncActive = true;
            await syncUploadArticles(rep);
        }
    } catch (err) {
        console.error(err);
    }

    highlightsSyncActive = false;
    articlesSyncActive = false;
}
