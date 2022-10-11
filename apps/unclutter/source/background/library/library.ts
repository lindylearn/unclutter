import { anonymousLibraryEnabled } from "../../common/featureFlags";
import { getLibraryUser } from "../../common/storage";
import { getRemoteFeatureFlag } from "../../content-script/messaging";
import { initReplicache, processActualReplicacheMessage } from "./replicache";
import { processLocalReplicacheMessage } from "./replicacheLocal";

let userId: string;
let libraryEnabled: string;
export async function initLibrary() {
    const userId = await getLibraryUser();
    const anonLibraryEnabled = await getRemoteFeatureFlag(
        anonymousLibraryEnabled
    );
    libraryEnabled = userId || anonLibraryEnabled;

    if (userId) {
        await initReplicache();
    } else if (anonLibraryEnabled) {
    }
}

export async function signUp() {
    // migrateMetricsUser()
}

export type ReplicacheProxyEventTypes = "query" | "mutate" | "pull";
export async function processReplicacheMessage(message) {
    if (userId) {
        return await processActualReplicacheMessage(message);
    } else {
        return await processLocalReplicacheMessage(message);
    }
}
