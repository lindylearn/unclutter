import { getHypothesisUsername, getHypothesisToken } from "../../common/annotations/storage";
import { getFeatureFlag, hypothesisSyncFeatureFlag } from "../../common/featureFlags";
import { getHypothesisSyncState } from "../../common/storage";
import { rep } from "./library";
import {
    downloadHypothesisAnnotations,
    uploadAnnotationsToHypothesis,
    watchLocalAnnotations,
} from "@unclutter/library-components/dist/common/sync/highlights";

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

    console.log("Starting annotations sync");
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
