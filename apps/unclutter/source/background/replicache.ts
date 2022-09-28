import { Replicache } from "replicache";
import { getLibraryUser, getLibraryUserJwt } from "../common/storage";
import {
    accessors,
    M,
    mutators,
} from "@unclutter/library-components/dist/store";

// const apiHost = "http://localhost:3000"
const apiHost = "https://library.lindylearn.io";

let rep: Replicache = null;
export async function initReplicache(): Promise<Replicache> {
    if (rep) {
        return;
    }

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

    // TODO sync full-text search & enable poke
    // use common package to avoid dealing with bundling issues again

    return rep;
}

export async function processReplicacheAccessor(
    methodName: string,
    args: any[] = []
) {
    console.log(methodName, args);

    return await rep.query((tx) => accessors[methodName](tx, ...args));
}
export async function processReplicacheMutator(
    methodName: string,
    args: object = {}
) {
    console.log(methodName, args);

    return await rep.mutate(methodName, args);
}
