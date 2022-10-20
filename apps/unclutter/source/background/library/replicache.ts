import { JSONValue, Replicache } from "replicache";
import { getLibraryUser, getLibraryUserJwt } from "../../common/storage";
import { accessors, M, mutators } from "@unclutter/library-components/dist/store";
import { ReplicacheProxyEventTypes } from "@unclutter/library-components/dist/common";
import type { Runtime } from "webextension-polyfill";

// const apiHost = "http://localhost:3000"
const apiHost = "https://library.lindylearn.io";

export let rep: Replicache<M> = null;
export async function initReplicache(): Promise<Replicache> {
    const userId = await getLibraryUser();
    const jwt = await getLibraryUserJwt();
    if (!userId || !jwt) {
        return;
    }

    console.log("Initializing replicache...");
    rep = new Replicache<M>({
        licenseKey: "l83e0df86778d44fba2909e3618d7965f",
        pushURL: `${apiHost || ""}/api/replicache/push?spaceID=${userId}`,
        pullURL: `${apiHost || ""}/api/replicache/pull?spaceID=${userId}`,
        name: userId,
        mutators,
        auth: jwt,
    });

    rep.createIndex({
        name: "articlesByTopic",
        // @ts-ignore
        keyPrefix: "/articles/",
        jsonPointer: "/topic_id",
        allowEmpty: true,
    });

    // TODO sync full-text search & enable poke
    // use common package to avoid dealing with bundling issues again

    return rep;
}

export async function processActualReplicacheMessage({
    type,
    methodName,
    args,
}: {
    type: ReplicacheProxyEventTypes;
    methodName?: string;
    args?: any;
}) {
    if (!rep) {
        return;
    }
    // console.log(methodName, args);

    if (type === "query") {
        return await rep.query((tx) => accessors[methodName](tx, ...args));
    } else if (type === "mutate") {
        return await rep.mutate[methodName](args);
    } else if (type === "pull") {
        return rep.pull();
    }
}

export async function processActualReplicacheSubscribe(port: Runtime.Port) {
    if (!rep) {
        return;
    }
    port.onMessage.addListener((msg) => {
        const { methodName, args } = msg;
        // console.log("subscribe", methodName);
        // port.onDisconnect.addListener(() => {
        //     console.log("subscribe disconnect", methodName);
        // });

        const cancel = rep.subscribe((tx) => accessors[methodName](tx, ...args), {
            onData: (data: JSONValue) => {
                port.postMessage(data);
            },
            onDone: () => {
                port.disconnect();
            },
            onError: (err: Error) => {
                console.error(err);
                port.disconnect();
            },
        });
        port.onDisconnect.addListener(cancel);
    });
}

export async function importEntries(entries: [string, JSONValue][]) {
    rep.mutate.importEntries(entries);
}
