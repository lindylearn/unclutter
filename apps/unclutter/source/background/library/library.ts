import {
    ReplicacheProxy,
    ReplicacheProxyEventTypes,
} from "@unclutter/library-components/dist/common/replicache";
import { JSONValue, ReadonlyJSONValue } from "replicache";
import { getLibraryUser } from "../../common/storage";
import { migrateMetricsUser } from "../metrics";
import {
    importEntries,
    initReplicache,
    processActualReplicacheMessage,
    processActualReplicacheSubscribe,
    processActualReplicacheWatch,
} from "./replicache";
import {
    LocalWriteTransaction,
    processLocalReplicacheMessage,
    processLocalReplicacheSubscribe,
    processLocalReplicacheWatch,
} from "./replicacheLocal";
import { deleteAllLocalScreenshots } from "./screenshots";
import { refreshSubscriptions } from "@unclutter/library-components/dist/feeds";
import { initArticlesSync, initHighlightsSync } from "./sync";
import type { UserInfo } from "@unclutter/library-components/dist/store";
import { deleteSearchIndex } from "@unclutter/library-components/dist/common/search";
import { syncDownloadAnnotations } from "@unclutter/library-components/dist/common/sync/highlights";
import { syncDownloadArticles } from "@unclutter/library-components/dist/common/sync/articles";

export let userId: string; // actual replicache id, don't change in dev
export let userInfo: UserInfo | undefined;
export let rep: ReplicacheProxy | null = null;
export async function initLibrary(isDev: boolean = false): Promise<void> {
    rep = getBackgroundReplicacheProxy();

    userId = await getLibraryUser();
    if (userId) {
        console.log(`Init Library for registered user ${userId}`);
        await initReplicache();
        const migrated = await migrateToAccount();
        if (migrated) {
            // rebuild index after data migration
            // await initSearchIndex(true);
        }
    } else {
        // local replicache mock doesn't need initialization
    }

    // deleteSearchIndex("");
    // deleteSearchIndex("-articles");

    // if (isDev) {
    //     await rep.mutate.updateUserInfo({ id: "dev-user", aiEnabled: true });
    // }
    userInfo = await rep.query.getUserInfo();

    await initHighlightsSync();
    await initArticlesSync();
}

export async function refreshLibraryFeeds() {
    await refreshSubscriptions(rep);
}
export async function syncPull() {
    try {
        await syncDownloadAnnotations(rep);
        await syncDownloadArticles(rep);
    } catch (err) {
        console.error(err);
    }
}

function getBackgroundReplicacheProxy(): ReplicacheProxy {
    return new ReplicacheProxy(
        null,
        (
            type: ReplicacheProxyEventTypes,
            methodName?: string,
            args?: any,
            targetExtension: string | null = null
        ) => {
            return processReplicacheMessage({
                type,
                methodName,
                args,
            });
        },
        processReplicacheWatch
    );
}

async function migrateToAccount(): Promise<boolean> {
    const localTx = new LocalWriteTransaction();
    const allLocalEntries = await localTx.scan().entries().toArray();
    if (allLocalEntries.length === 0) {
        return false;
    }

    console.log(
        `Migrating ${allLocalEntries.length} local replicache entries to library account...`
    );
    // @ts-ignore
    await importEntries(allLocalEntries as [string, ReadonlyJSONValue][]);

    await Promise.all(allLocalEntries.map(([key, value]) => localTx.del(key)));

    // other migration tasks
    await deleteAllLocalScreenshots();
    await migrateMetricsUser();

    return true;
}

export async function processReplicacheMessage(message) {
    if (userId) {
        return await processActualReplicacheMessage(message);
    } else {
        return await processLocalReplicacheMessage(message);
    }
}

// only supported for content scripts
export async function processReplicacheSubscribe(port) {
    if (userId) {
        await processActualReplicacheSubscribe(port);
    } else {
        await processLocalReplicacheSubscribe(port);
    }
}

// only supported in background
export function processReplicacheWatch(
    prefix: string,
    onDataChanged: (added: JSONValue[], removed: JSONValue[]) => void
) {
    if (userId) {
        return processActualReplicacheWatch(prefix, onDataChanged);
    } else {
        return processLocalReplicacheWatch(prefix, onDataChanged);
    }
}
