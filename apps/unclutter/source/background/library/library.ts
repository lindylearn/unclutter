import { getUrlHash } from "@unclutter/library-components/dist/common";
import { Annotation } from "@unclutter/library-components/dist/store";
import { ReadonlyJSONValue } from "replicache";
import { getLibraryUser } from "../../common/storage";
import { deleteAllLegacyAnnotations, getAllLegacyAnnotations } from "../../sidebar/common/legacy";
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
    await importLegacyAnnotations();

    userId = await getLibraryUser();
    if (userId) {
        console.log(`Init Library for user ${userId}`);
        await initReplicache();
        await migrateToAccount();
    }
}

async function importLegacyAnnotations() {
    const annotations = await getAllLegacyAnnotations();
    if (annotations.length === 0) {
        return;
    }

    console.log(`Migrating ${annotations.length} legacy annotations to replicache...`);
    await Promise.all(
        annotations.map((a) => {
            processReplicacheMessage({
                type: "mutate",
                methodName: "putAnnotation",
                args: {
                    ...a,
                    article_id: getUrlHash(a.url),
                    created_at: new Date(a.created_at).getTime() / 1000,
                } as Annotation,
            });
        })
    );

    await deleteAllLegacyAnnotations();
}

async function migrateToAccount() {
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
