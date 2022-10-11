import {
    AsyncIterableIteratorToArray,
    ReadonlyJSONValue,
    ReadTransaction,
    ScanResult,
    WriteTransaction,
} from "replicache";
import { ReplicacheProxyEventTypes } from "./replicache";
import { accessors, mutators } from "@unclutter/library-components/dist/store";
import * as idb from "idb-keyval";

export async function processLocalReplicacheMessage({
    type,
    methodName,
    args,
}: {
    type: ReplicacheProxyEventTypes;
    methodName?: string;
    args?: any;
}) {
    console.log(methodName, args);

    if (type === "query") {
        const result = await accessors[methodName](
            new LocalReadTransaction(),
            ...args
        );
        console.log("result", result);
        return result;
    } else if (type === "mutate") {
        return await mutators[methodName](new LocalReadTransaction(), args);
    }
}

class LocalReadTransaction implements ReadTransaction {
    clientID = "local-replicache";

    async get(key: string): Promise<ReadonlyJSONValue> {
        return await idb.get(key);
    }

    async has(key: string): Promise<boolean> {
        return !!this.get(key);
    }

    async isEmpty(): Promise<boolean> {
        return (await idb.keys()).length === 0;
    }

    scan() {
        return new LocalScanResult();
    }
}

class LocalScanResult implements ScanResult<string, ReadonlyJSONValue> {
    [Symbol.asyncIterator]() {
        return this.values();
    }

    values() {
        return new AsyncIteratorToArray<ReadonlyJSONValue>(
            arrayToAsyncIterator(idb.values())
        );
    }

    keys() {
        return new AsyncIteratorToArray<string>(
            arrayToAsyncIterator(idb.keys())
        );
    }

    entries() {
        return new AsyncIteratorToArray<[string, ReadonlyJSONValue]>(
            arrayToAsyncIterator(idb.entries())
        );
    }

    toArray() {
        return this.values().toArray();
    }
}

async function* arrayToAsyncIterator<T>(promise: Promise<T[]>) {
    const array = await promise;
    for (let x of array) {
        yield x;
    }
}

class AsyncIteratorToArray<K> implements AsyncIterableIteratorToArray<K> {
    private iterator: AsyncIterableIterator<K>;
    constructor(iterator: AsyncIterableIterator<K>) {
        this.iterator = iterator;
    }

    next() {
        return this.iterator.next();
    }

    [Symbol.asyncIterator]() {
        return this.iterator[Symbol.asyncIterator]();
    }

    async toArray(): Promise<K[]> {
        let e = [];
        for await (let t of this.iterator) e.push(t);
        return e;
    }
}
