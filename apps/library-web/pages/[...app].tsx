import { getUser, withPageAuth } from "@supabase/auth-helpers-nextjs";
import { createContext, useEffect, useState } from "react";
import { wrap as wrapWorker } from "comlink";
import { createSpace, spaceExists } from "@unclutter/replicache-nextjs/lib/backend";
import { useReplicache } from "@unclutter/replicache-nextjs/lib/frontend";
import App from "../src/App";
import {
    mutators,
    accessors,
    ReplicacheContext,
    useSubscribe,
    PartialSyncState,
} from "@unclutter/library-components/dist/store";
import {
    SearchIndex,
    setUnclutterLibraryAuth,
    syncSearchIndex,
} from "@unclutter/library-components/dist/common";

export const SearchWorkerContent = createContext<MessagePort | null>(null);

export default function Index({ spaceID }: { spaceID: string }) {
    const [workerIndex, setWorkerIndex] = useState<SharedWorker>();
    useEffect(() => {
        setUnclutterLibraryAuth(spaceID);

        // try {
        //     const worker = new SharedWorker(
        //         new URL("../worker.js", import.meta.url),
        //         "unclutter-library-search"
        //     );
        //     setWorkerIndex(worker);
        // } catch (err) {
        //     // e.g. happens on mobile
        //     console.error("SharedWorker not supported", err);
        // }
    }, []);

    // Configure Replicache
    const rep = useReplicache({
        name: spaceID,
        mutators,
        accessors,
    });
    useEffect(() => {
        if (!rep) {
            return;
        }

        rep.createIndex({
            name: "articlesByTopic",
            // @ts-ignore
            keyPrefix: "/articles/",
            jsonPointer: "/topic_id",
            allowEmpty: true,
        });
        rep.createIndex({
            name: "annotationsPerArticle",
            // @ts-ignore
            keyPrefix: "/annotations/",
            jsonPointer: "/article_id",
            allowEmpty: true,
        });
    }, [rep]);

    // Init search index
    // useEffect(() => {
    //     try {
    //         if (rep && workerIndex) {
    //             (async () => {
    //                 console.log("Setting up search index...");
    //                 const searchIndex = wrapWorker<SearchIndex>(workerIndex.port);
    //                 await syncSearchIndex(rep, searchIndex as unknown as SearchIndex);
    //             })();
    //         }
    //     } catch (err) {
    //         console.error("Error syncing search index", err);
    //     }
    // }, [rep, workerIndex]);

    // @ts-ignore
    const partialSync: PartialSyncState | "NOT_RECEIVED_FROM_SERVER" | undefined = useSubscribe(
        rep,
        // @ts-ignore
        rep?.subscribe.getPartialSyncState(),
        "NOT_RECEIVED_FROM_SERVER"
    );

    useEffect(() => {
        console.log("partialSync", partialSync);
        if (partialSync !== "PARTIAL_SYNC_COMPLETE") {
            rep?.pull();
        }
    }, [rep, partialSync]);

    if (!rep) {
        return <div />;
    }

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <SearchWorkerContent.Provider value={workerIndex?.port || null}>
                <App />
            </SearchWorkerContent.Provider>
        </ReplicacheContext.Provider>
    );
}

export const getServerSideProps = withPageAuth({
    redirectTo: "/login",
    async getServerSideProps(context) {
        const { user } = await getUser(context);

        const spaceID = user.id; // use user id as space id for easier authorization
        if (!(await spaceExists(spaceID))) {
            await createSpace(spaceID);
            return {
                redirect: {
                    destination: `/welcome`,
                    permanent: false,
                },
            };
        }

        return {
            props: {
                spaceID,
            },
        };
    },
});
