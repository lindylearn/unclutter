import {
    AsyncIterableIteratorToArray,
    JSONValue,
    ReadonlyJSONValue,
    ReadTransaction,
    ScanNoIndexOptions,
    ScanOptions,
    ScanResult,
    WriteTransaction,
} from "replicache";
import { ReplicacheProxyEventTypes } from "./replicache";
import { accessors, mutators } from "@unclutter/library-components/dist/store";
import * as idb from "idb-keyval";

// local-only replicache stub
export async function processLocalReplicacheMessage({
    type,
    methodName,
    args,
}: {
    type: ReplicacheProxyEventTypes;
    methodName?: string;
    args?: any;
}) {
    if (type === "query") {
        const result = await accessors[methodName](
            new LocalReadTransaction(),
            ...args
        );
        // console.log(methodName, args, result);
        return result;
    } else if (type === "mutate") {
        const result = await mutators[methodName](
            new LocalWriteTransaction(),
            args
        );
        // console.log(methodName, args, result);
        return result;
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

    scan(options?: ScanNoIndexOptions) {
        return new LocalScanResult<ReadonlyJSONValue>(options);
    }
}

class LocalWriteTransaction
    extends LocalReadTransaction
    implements WriteTransaction
{
    async put(key: string, value: JSONValue): Promise<void> {
        await idb.set(key, value);
    }

    async del(key: string): Promise<boolean> {
        const exists = this.has(key);
        await idb.del(key);
        return exists;
    }

    async get(key: string): Promise<JSONValue> {
        return await idb.get(key);
    }

    scan(options?: ScanOptions) {
        return new LocalScanResult<JSONValue>(options);
    }
}

class LocalScanResult<R> implements ScanResult<string, R> {
    private options?: ScanOptions;
    constructor(options?: ScanOptions) {
        this.options = options;
    }

    keys() {
        return new AsyncIteratorToArray<string>(
            this.toAsyncIterator(
                idb
                    .entries()
                    .then(async (entries: [string, R][]) =>
                        this.filterEntries(entries).map((entry) => entry[0])
                    )
            )
        );
    }

    values() {
        return new AsyncIteratorToArray<R>(
            this.toAsyncIterator(
                idb
                    .entries()
                    .then(async (entries: [string, R][]) =>
                        this.filterEntries(entries).map((entry) => entry[1])
                    )
            )
        );
    }

    entries() {
        return new AsyncIteratorToArray<[string, R]>(
            this.toAsyncIterator(
                idb
                    .entries()
                    .then(async (entries: [string, R][]) =>
                        this.filterEntries(entries)
                    )
            )
        );
    }

    [Symbol.asyncIterator]() {
        return this.values();
    }

    toArray() {
        return this.values().toArray();
    }

    private filterEntries(entries: [string, R][]): [string, R][] {
        entries.sort((a, b) => (a[0] >= b[0] ? 1 : -1));

        // stub index implementation
        // @ts-ignore
        if (this.options.indexName === "articlesByTopic") {
            entries = entries.filter(
                // @ts-ignore
                (e) => e[1].topic_id === this.options.prefix
            );
        } else if (this.options.prefix) {
            entries = entries.filter((e) =>
                e[0].startsWith(this.options.prefix)
            );
        }

        if (this.options.start) {
            entries = entries.filter(
                (e) =>
                    (e[0] === this.options.start.key &&
                        !this.options.start.exclusive) ||
                    e[0] > this.options.start.key
            );
        }
        if (this.options.limit) {
            entries = entries.slice(0, this.options.limit);
        }

        return entries;
    }

    private async *toAsyncIterator<T>(resultsPromise: Promise<T[]>) {
        let results = await resultsPromise;
        for (let x of results) {
            yield x;
        }
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
