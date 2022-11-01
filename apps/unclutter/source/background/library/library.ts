import {
    clusterLibraryArticles,
    getUrlHash,
    normalizeUrl,
    ReplicacheProxy,
    ReplicacheProxyEventTypes,
} from "@unclutter/library-components/dist/common";
import { Annotation } from "@unclutter/library-components/dist/store";
import groupBy from "lodash/groupBy";
import { JSONValue, ReadonlyJSONValue } from "replicache";
import { addArticlesToLibrary } from "../../common/api";
import {
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
    setFeatureFlag,
} from "../../common/featureFlags";
import { constructLocalArticleInfo, LibraryInfo } from "../../common/schema";
import { getLibraryUser } from "../../common/storage";
import { getHypothesisAnnotationsSince } from "../../sidebar/common/api";
import { deleteAllLegacyAnnotations, getAllLegacyAnnotations } from "../../sidebar/common/legacy";
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
import { initSearchIndex } from "./search";

export let userId: string;
export let rep: ReplicacheProxy | null = null;
export async function initLibrary() {
    userId = await getLibraryUser();
    if (userId) {
        console.log(`Init Library for registered user ${userId}`);
        await initReplicache();
        await migrateToAccount();
    } else {
        // local replicache mock doesn't need initialization
    }

    rep = getBackgroundReplicacheProxy();

    const userInfo = await rep.query.getUserInfo();
    await initSearchIndex(userInfo, !!userId); // rebuild index after replicache migration

    try {
        await importLegacyAnnotations();
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

async function importLegacyAnnotations() {
    const annotations = await getAllLegacyAnnotations();

    // const hypothesisSyncEnabled = await getFeatureFlag(hypothesisSyncFeatureFlag);
    // if (hypothesisSyncEnabled) {
    //     const remoteAnnotations = await getHypothesisAnnotationsSince(undefined, 200);
    //     annotations.push(...remoteAnnotations.slice(50));
    // }

    if (annotations.length === 0) {
        return;
    }
    console.log(`Migrating ${annotations.length} legacy annotations to replicache...`);

    // const userInfo = await processReplicacheMessage({
    //     type: "query",
    //     methodName: "getUserInfo",
    //     args: [],
    // });

    // fetch article state
    const annotationsPerArticle = groupBy(annotations, (a) => a.url);
    const urls = Object.keys(annotationsPerArticle);

    let articleInfos = urls.map((url) =>
        constructLocalArticleInfo(url, getUrlHash(url), normalizeUrl(url))
    );

    articleInfos = articleInfos.map((articleInfo) => {
        articleInfo.article.reading_progress = 1.0;

        const articleAnnotations = annotationsPerArticle[articleInfo.article.url];
        if (articleAnnotations.length > 0) {
            articleInfo.article.time_added = Math.round(
                new Date(articleAnnotations[0].created_at).getTime() / 1000
            );
        }

        return articleInfo;
    });

    // insert articles
    await Promise.all(
        articleInfos.map((articleInfo) => {
            // if (articleInfo.topic) {
            //     processReplicacheMessage({
            //         type: "mutate",
            //         methodName: "putTopic",
            //         args: articleInfo.topic,
            //     });
            // }
            processReplicacheMessage({
                type: "mutate",
                methodName: "putArticleIfNotExists",
                args: articleInfo.article,
            });
            // if (articleInfo.new_links?.length > 0) {
            //     processReplicacheMessage({
            //         type: "mutate",
            //         methodName: "importArticleLinks",
            //         args: { links: articleInfo.new_links },
            //     });
            // }
        })
    );

    // insert annotations
    await Promise.all(
        annotations.map((a) => {
            processReplicacheMessage({
                type: "mutate",
                methodName: "putAnnotation",
                args: {
                    ...a,
                    article_id: getUrlHash(a.url),
                    created_at: Math.round(new Date(a.created_at).getTime() / 1000),
                } as Annotation,
            });
        })
    );

    await deleteAllLegacyAnnotations();
    setFeatureFlag(hypothesisSyncFeatureFlag, false); // disable another import
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
