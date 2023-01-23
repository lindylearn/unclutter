import type { NextApiRequest } from "next";
import { transact } from "./pg.js";
import { getChangedEntries, getCookie, getLastMutationID } from "./data.js";
import { z } from "zod";
import type { PullResponse } from "replicache";
import partition from "lodash/partition";

import { partialSyncStateSchema } from "@unclutter/library-components/dist/store";

const cookieSchema = z.union([
  z.object({
    version: z.number(),
    partialSync: partialSyncStateSchema,
  }),
  z.null(),
]);
// type Cookie = z.TypeOf<typeof cookieSchema>;

const pullRequest = z.object({
  clientID: z.string(),
  cookie: cookieSchema,
  schemaVersion: z.string(),
});

export async function pull(
  spaceID: string,
  requestBody: NextApiRequest
): Promise<PullResponse> {
  console.log(`Processing pull`, JSON.stringify(requestBody, null, ""));

  // @ts-ignore
  const rawCookie = requestBody.cookie;
  if (rawCookie !== null && !isNaN(rawCookie)) {
    // convert old number cookie format
    console.log(`Converting old cookie format`);
    // @ts-ignore
    requestBody.cookie = {
      version: rawCookie,
      partialSync: {
        minVersion: 0,
        maxVersion: rawCookie,
        endKey: "",
      },
    };
  }

  const pull = pullRequest.parse(requestBody);
  const requestCookie = pull.cookie;

  // get changed entries
  const t0 = Date.now();
  let [entries, lastMutationID, responseCookieVersion] = await transact(
    async (executor) => {
      return Promise.all([
        getChangedEntries(executor, spaceID, requestCookie?.version ?? 0),
        getLastMutationID(executor, pull.clientID),
        getCookie(executor, spaceID),
      ]);
    }
  );
  const [normalEntries, textEntries] = partition(entries, ([key, _]) => {
    return !key.startsWith("text/");
  });
  console.log(
    `Read changed entries in ${Date.now() - t0}ms (${
      normalEntries.length
    } normal, ${textEntries.length} text)`
  );
  if (responseCookieVersion === undefined) {
    throw new Error(`Unknown space ${spaceID}`);
  }

  // by default only process article entries
  entries = normalEntries;

  // const limit = 100;
  // const t1 = Date.now();
  // let partialSyncState: PartialSyncState = "PARTIAL_SYNC_COMPLETE";
  // if (!requestCookie) {
  //   // initial pull: only return articles and set up partial sync
  //   console.log(`Initial pull`);
  //   partialSyncState = {
  //     minVersion: 0,
  //     maxVersion: responseCookieVersion,
  //     endKey: "",
  //   };
  // } else if (
  //   requestCookie.partialSync === "PARTIAL_SYNC_COMPLETE" &&
  //   textEntries.length !== 0
  // ) {
  //   // changed entries include fulltext changes, otherwise client up-to-date

  //   if (textEntries.length < limit) {
  //     // process few text entries in same pull (e.g. for single articles)
  //     console.log(`Including ${textEntries.length} text entries in main pull`);
  //     entries = entries.concat(textEntries);
  //     partialSyncState = "PARTIAL_SYNC_COMPLETE";
  //   } else {
  //     // start new partial sync
  //     console.log(`Queued partial pull for ${textEntries.length} text entries`);
  //     partialSyncState = {
  //       minVersion: requestCookie.version,
  //       maxVersion: responseCookieVersion,
  //       endKey: "",
  //     };
  //   }
  // } else if (requestCookie.partialSync !== "PARTIAL_SYNC_COMPLETE") {
  //   // finish ongoing partial sync
  //   const partialMinVersion = requestCookie.partialSync.minVersion;
  //   const partialMaxVersion = requestCookie.partialSync.maxVersion;
  //   const partialStartKey = requestCookie.partialSync.endKey;

  //   const incrementalEntries = await transact(async (executor) => {
  //     // fetch all articles to sync
  //     // TODO implement custom queries
  //     const allEntries = await getChangedEntries(
  //       executor,
  //       spaceID,
  //       partialMinVersion,
  //       partialMaxVersion
  //     );
  //     const fulltextEntries = allEntries
  //       .filter((e) => e[0].startsWith("text/"))
  //       .filter((e) => e[0] > partialStartKey);

  //     const incrementalEntries = fulltextEntries.slice(0, limit);

  //     console.log(
  //       `Continuing partial pull with ${incrementalEntries.length} entries (${
  //         fulltextEntries.length - incrementalEntries.length
  //       } left)`
  //     );
  //     return incrementalEntries;
  //   });

  //   const endKey = incrementalEntries[incrementalEntries.length - 1]?.[0];
  //   entries = entries.concat(incrementalEntries);

  //   if (incrementalEntries.length === limit) {
  //     // this partial sync not done
  //     partialSyncState = {
  //       minVersion: partialMinVersion,
  //       maxVersion: partialMaxVersion,
  //       endKey: endKey,
  //     };
  //   } else {
  //     // this partial sync is done

  //     if (partialMaxVersion < responseCookieVersion) {
  //       // but need to check newer versions
  //       console.log(`Queued partial pull for newer version`);
  //       partialSyncState = {
  //         minVersion: partialMaxVersion,
  //         maxVersion: responseCookieVersion,
  //         endKey: "",
  //       };
  //     } else {
  //       partialSyncState = "PARTIAL_SYNC_COMPLETE";
  //     }
  //   }
  // }
  // console.log(`Processed partial sync in ${Date.now() - t1}ms`);

  // create sync state entry to re-trigger pull in frontend
  // if (requestCookie?.partialSync !== partialSyncState) {
  //   entries.push([
  //     PARTIAL_SYNC_STATE_KEY,
  //     JSON.stringify(partialSyncState),
  //     false,
  //   ]);
  // }

  // set cookie for next pull
  const responseCookie = {
    version: responseCookieVersion,
    // partialSync: partialSyncState,
  };

  console.log("lastMutationID: ", lastMutationID);
  console.log("responseCookie: ", responseCookie);

  const resp: PullResponse = {
    lastMutationID: lastMutationID ?? 0,
    cookie: responseCookie,
    patch: [],
  };

  for (const [key, value, deleted] of entries) {
    if (deleted) {
      resp.patch.push({
        op: "del",
        key,
      });
    } else {
      resp.patch.push({
        op: "put",
        key,
        value,
      });
    }
  }

  console.log(`Returning ${resp.patch.length} entries\n`);
  return resp;
}
