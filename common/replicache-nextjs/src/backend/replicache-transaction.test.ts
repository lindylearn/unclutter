import { ReplicacheTransaction } from "./replicache-transaction.js";
import { expect } from "chai";
import { test } from "mocha";
import { withExecutor } from "./pg.js";
import { getEntry, putEntry } from "./data.js";
import type { ScanOptions } from "replicache";

test("ReplicacheTransaction", async () => {
  await withExecutor(async (executor) => {
    const t1 = new ReplicacheTransaction(executor, "s1", "c1", 1);

    expect(t1.clientID).equal("c1");
    expect(await t1.has("foo")).false;
    expect(await t1.get("foo")).undefined;

    await t1.put("foo", "bar");
    expect(await t1.has("foo")).true;
    expect(await t1.get("foo")).equal("bar");

    await t1.flush();

    expect(await getEntry(executor, "s1", "foo")).equal("bar");

    const t2 = new ReplicacheTransaction(executor, "s1", "c1", 2);
    await t2.del("foo");
    await t2.flush();

    expect(await getEntry(executor, "s1", "foo")).equal(undefined);
    const qr = await executor(
      `select value, deleted, version
      from entry where spaceid = 's1' and key = 'foo'`
    );
    const [row] = qr.rows;
    expect(row).deep.equal({
      value: `"bar"`,
      deleted: true,
      version: 2,
    });
  });
});

test("ReplicacheTransaction overlap", async () => {
  await withExecutor(async (executor) => {
    const t1 = new ReplicacheTransaction(executor, "s1", "c1", 1);
    await t1.put("foo", "bar");

    const t2 = new ReplicacheTransaction(executor, "s1", "c1", 1);
    expect(await t2.has("foo")).false;

    await t1.flush();
    expect(await t2.has("foo")).false;

    const t3 = new ReplicacheTransaction(executor, "s1", "c1", 1);
    expect(await t3.has("foo")).true;
  });
});

test("ReplicacheTransaction scan", async () => {
  async function deleteAllEntries() {
    await withExecutor(async (executor) => {
      await executor(`delete from entry`);
    });
  }
  async function putEntries(entries: string[]) {
    await withExecutor(async (executor) => {
      for (const entry of entries) {
        await putEntry(executor, "s1", entry, entry, 1);
      }
    });
  }
  async function test(
    sources: string[],
    changes: string[],
    scanOpts: ScanOptions,
    expected: string[]
  ) {
    await deleteAllEntries();
    await putEntries(sources);
    await withExecutor(async (executor) => {
      const t = new ReplicacheTransaction(executor, "s1", "c1", 2);
      for (const change of changes) {
        await t.put(change, change);
      }
      await t.flush();
      const results = await t.scan(scanOpts).keys().toArray();
      expect(results).deep.equal(expected);
    });
  }
  await test(["a"], ["b"], {}, ["a", "b"]);
  await test(["a", "c"], ["b", "d"], { start: { key: "c" } }, ["c", "d"]);
  await test(["a", "b"], ["bb", "c"], { prefix: "b" }, ["b", "bb"]);
  await test(["a", "b"], ["bb", "c"], { prefix: "b", limit: 1 }, ["b"]);
});
