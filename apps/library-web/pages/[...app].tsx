import { getUser, withPageAuth } from "@supabase/auth-helpers-nextjs";
import { createContext, useEffect } from "react";
import { createSpace, spaceExists } from "@unclutter/replicache-nextjs/lib/backend";
import NewModalApp from "../src/new/NewModalApp";

import { useReplicache } from "@unclutter/replicache-nextjs/lib/frontend";
import {
    mutators,
    accessors,
    ReplicacheContext,
    PartialSyncState,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { LocalScreenshotContext } from "@unclutter/library-components/dist/components";
import {
    getLocalScreenshot,
    getUnclutterExtensionId,
} from "@unclutter/library-components/dist/common";

export const SearchWorkerContent = createContext<MessagePort | null>(null);

export default function Index({ userId }: { userId: string }) {
    const rep = useReplicache({
        name: userId,
        mutators,
        accessors,
    });

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

    return (
        <ReplicacheContext.Provider value={rep}>
            <LocalScreenshotContext.Provider value={getLocalScreenshot}>
                <NewModalApp />
            </LocalScreenshotContext.Provider>
        </ReplicacheContext.Provider>
    );
}

export const getServerSideProps = withPageAuth({
    redirectTo: "/login",
    async getServerSideProps(context) {
        const { user } = await getUser(context);

        const userId = user.id; // use user id as space id for easier authorization
        if (!(await spaceExists(userId))) {
            await createSpace(userId);
            return {
                redirect: {
                    destination: `/`,
                    permanent: false,
                },
            };
        }

        return {
            props: {
                userId,
            },
        };
    },
});
