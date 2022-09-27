import {
  isScanIndexOptions,
  JSONValue,
  makeScanResult,
  ScanNoIndexOptions,
  ScanOptions,
  WriteTransaction,
  mergeAsyncIterables,
  filterAsyncIterable,
} from "replicache";
import { delEntry, getEntries, getEntry, putEntry } from "./data.js";
import type { Executor } from "./pg.js";

type CacheMap = Map<string, { value: JSONValue | undefined; dirty: boolean }>;

/**
 * Implements Replicache's WriteTransaction interface in terms of a Postgres
 * transaction.
 */
export class ReplicacheTransaction implements WriteTransaction {
  private _spaceID: string;
  private _clientID: string;
  private _version: number;
  private _executor: Executor;
  private _cache: CacheMap = new Map();

  constructor(
    executor: Executor,
    spaceID: string,
    clientID: string,
    version: number
  ) {
    this._spaceID = spaceID;
    this._clientID = clientID;
    this._version = version;
    this._executor = executor;
  }

  get clientID(): string {
    return this._clientID;
  }

  async put(key: string, value: JSONValue): Promise<void> {
    this._cache.set(key, { value, dirty: true });
  }
  async del(key: string): Promise<boolean> {
    const had = await this.has(key);
    this._cache.set(key, { value: undefined, dirty: true });
    return had;
  }
  async get(key: string): Promise<JSONValue | undefined> {
    const entry = this._cache.get(key);
    if (entry) {
      return entry.value;
    }
    const value = await getEntry(this._executor, this._spaceID, key);
    this._cache.set(key, { value, dirty: false });
    return value;
  }
  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== undefined;
  }

  async isEmpty(): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of this.scan()) {
      return false;
    }
    return true;
  }

  scan(options: ScanOptions = {} as ScanNoIndexOptions) {
    if (isScanIndexOptions(options)) {
      throw new Error("not implemented");
    }

    const { _executor: executor, _spaceID: spaceID, _cache: cache } = this;

    return makeScanResult<ScanNoIndexOptions, JSONValue>(
      options,
      (fromKey: string) => {
        const source = getEntries(executor, spaceID, fromKey);
        const pending = getCacheEntries(cache, fromKey);
        const merged = mergeAsyncIterables(source, pending, entryCompare);
        const filtered = filterAsyncIterable(
          merged,
          (entry) => entry[1] !== undefined
        ) as AsyncIterable<readonly [string, JSONValue]>;
        return filtered;
      }
    );
  }

  async flush(): Promise<void> {
    await Promise.all(
      [...this._cache.entries()]
        .filter(([, { dirty }]) => dirty)
        .map(([k, { value }]) => {
          if (value === undefined) {
            return delEntry(this._executor, this._spaceID, k, this._version);
          } else {
            return putEntry(
              this._executor,
              this._spaceID,
              k,
              value,
              this._version
            );
          }
        })
    );
  }
}

function getCacheEntries(
  cache: CacheMap,
  fromKey: string
): Iterable<readonly [string, JSONValue | undefined]> {
  const entries = [];
  for (const [key, { value, dirty }] of cache) {
    if (dirty && stringCompare(key, fromKey) >= 0) {
      entries.push([key, value] as const);
    }
  }
  entries.sort((a, b) => stringCompare(a[0], b[0]));
  return entries;
}

function stringCompare(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

function entryCompare(
  a: readonly [string, unknown],
  b: readonly [string, unknown]
): number {
  return stringCompare(a[0], b[0]);
}
