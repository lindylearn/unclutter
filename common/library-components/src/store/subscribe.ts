import type { ReadonlyJSONValue, ReadTransaction, SubscribeOptions } from "replicache";
import { useEffect, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { RuntimeReplicache } from "./replicache";

// adapted from https://github.com/rocicorp/replicache-react/blob/main/src/index.ts

type Subscribable = Pick<RuntimeReplicache, "subscribe">;

// We wrap all the callbacks in a `unstable_batchedUpdates` call to ensure that
// we do not render things more than once over all of the changed subscriptions.
let hasPendingCallback = false;
let callbacks: (() => void)[] = [];
function doCallback() {
    const cbs = callbacks;
    callbacks = [];
    hasPendingCallback = false;
    unstable_batchedUpdates(() => {
        for (const callback of cbs) {
            callback();
        }
    });
}

export function useSubscribe<R extends ReadonlyJSONValue>(
    rep: Subscribable | null | undefined,
    subscribeQuery: ((options: SubscribeOptions<R, Error>) => void) | undefined,
    def: R,
    deps: Array<unknown> = []
): R {
    const [snapshot, setSnapshot] = useState<R>(def);
    useEffect(() => {
        if (!rep || !subscribeQuery) {
            return;
        }

        return subscribeQuery({
            onData: (data: R) => {
                callbacks.push(() => setSnapshot(data));
                if (!hasPendingCallback) {
                    void Promise.resolve().then(doCallback);
                    hasPendingCallback = true;
                }
            },
        });
    }, [rep, ...deps]);
    return snapshot;
}
