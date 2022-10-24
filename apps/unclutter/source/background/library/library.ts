import { ReadonlyJSONValue } from "replicache";
import { getLibraryUser } from "../../common/storage";
import { migrateMetricsUser } from "../metrics";
import {
    importEntries,
    initReplicache,
    processActualReplicacheMessage,
    processActualReplicacheSubscribe,
} from "./replicache";
import {
    LocalWriteTransaction,
    processLocalReplicacheMessage,
    processLocalReplicacheSubscribe,
} from "./replicacheLocal";
import { deleteAllLocalScreenshots } from "./screenshots";

let userId: string;
export async function initLibrary() {
    userId = await getLibraryUser();
    if (userId) {
        console.log(`Init Library for user ${userId}`);
        await initReplicache();
        await checkMigrate();
    }
}

export async function checkMigrate() {
    const localTx = new LocalWriteTransaction();
    const allLocalEntries = await localTx.scan().entries().toArray();
    if (allLocalEntries.length > 0) {
        console.log(
            `Migrating ${allLocalEntries.length} local replicache entries to library account...`
        );
        // @ts-ignore
        await importEntries(allLocalEntries as [string, ReadonlyJSONValue][]);

        await Promise.all(allLocalEntries.map(([key, value]) => localTx.del(key)));

        // other migration tasks
        await deleteAllLocalScreenshots();
        await migrateMetricsUser();
    }
}

export async function processReplicacheMessage(message) {
    if (userId) {
        return await processActualReplicacheMessage(message);
    } else {
        return await processLocalReplicacheMessage(message);
    }
}

export async function processReplicacheSubscribe(port) {
    if (userId) {
        await processActualReplicacheSubscribe(port);
    } else {
        await processLocalReplicacheSubscribe(port);
    }
}
