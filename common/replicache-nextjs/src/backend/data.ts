import type { JSONValue } from "replicache";
import { z } from "zod";
import type { Executor } from "./pg.js";

export async function getEntry(
  executor: Executor,
  spaceid: string,
  key: string
): Promise<JSONValue | undefined> {
  const { rows } = await executor(
    "select value from entry where spaceid = $1 and key = $2 and deleted = false",
    [spaceid, key]
  );
  const value = rows[0]?.value;
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(value);
}

export async function putEntry(
  executor: Executor,
  spaceID: string,
  key: string,
  value: JSONValue,
  version: number
): Promise<void> {
  await executor(
    `
    insert into entry (spaceid, key, value, deleted, version, lastmodified)
    values ($1, $2, $3, false, $4, now())
      on conflict (spaceid, key) do update set
        value = $3, deleted = false, version = $4, lastmodified = now()
    `,
    [spaceID, key, JSON.stringify(value), version]
  );
}

export async function delEntry(
  executor: Executor,
  spaceID: string,
  key: string,
  version: number
): Promise<void> {
  await executor(
    `update entry set deleted = true, version = $3 where spaceid = $1 and key = $2`,
    [spaceID, key, version]
  );
}

export async function* getEntries(
  executor: Executor,
  spaceID: string,
  fromKey: string
): AsyncIterable<readonly [string, JSONValue]> {
  const { rows } = await executor(
    `select key, value from entry where spaceid = $1 and key >= $2 and deleted = false order by key`,
    [spaceID, fromKey]
  );
  for (const row of rows) {
    yield [row.key as string, JSON.parse(row.value) as JSONValue] as const;
  }
}

export async function getChangedEntries(
  executor: Executor,
  spaceID: string,
  prevVersion: number,
  maxVersion?: number
): Promise<[key: string, value: JSONValue, deleted: boolean][]> {
  if (!maxVersion) {
    const { rows } = await executor(
      `select key, value, deleted from entry where spaceid = $1 and version > $2`,
      [spaceID, prevVersion]
    );
    return rows.map((row) => [row.key, JSON.parse(row.value), row.deleted]);
  } else {
    const { rows } = await executor(
      `select key, value, deleted from entry where spaceid = $1 and version > $2 and version <= $3 order by key`,
      [spaceID, prevVersion, maxVersion]
    );
    return rows.map((row) => [row.key, JSON.parse(row.value), row.deleted]);
  }
}

export async function createSpace(
  executor: Executor,
  spaceID: string
): Promise<void> {
  console.log("creating space", spaceID);
  await executor(
    `insert into space (id, version, lastmodified) values ($1, 0, now())`,
    [spaceID]
  );
}

export async function getCookie(
  executor: Executor,
  spaceID: string
): Promise<number | undefined> {
  const { rows } = await executor(`select version from space where id = $1`, [
    spaceID,
  ]);
  const value = rows[0]?.version;
  if (value === undefined) {
    return undefined;
  }
  return z.number().parse(value);
}

export async function setCookie(
  executor: Executor,
  spaceID: string,
  version: number
): Promise<void> {
  await executor(
    `update space set version = $2, lastmodified = now() where id = $1`,
    [spaceID, version]
  );
}

export async function getLastMutationID(
  executor: Executor,
  clientID: string
): Promise<number | undefined> {
  const { rows } = await executor(
    `select lastmutationid from client where id = $1`,
    [clientID]
  );
  const value = rows[0]?.lastmutationid;
  if (value === undefined) {
    return undefined;
  }
  return z.number().parse(value);
}

export async function setLastMutationID(
  executor: Executor,
  clientID: string,
  lastMutationID: number
): Promise<void> {
  await executor(
    `
    insert into client (id, lastmutationid, lastmodified)
    values ($1, $2, now())
      on conflict (id) do update set lastmutationid = $2, lastmodified = now()
    `,
    [clientID, lastMutationID]
  );
}
