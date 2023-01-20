import { getUser, withPageAuth } from "@supabase/auth-helpers-nextjs";
import { createContext, useEffect } from "react";
import { createSpace, spaceExists } from "@unclutter/replicache-nextjs/lib/backend";
import NewApp from "../src/new/NewApp";

import { useReplicache } from "@unclutter/replicache-nextjs/lib/frontend";
import {
    mutators,
    accessors,
    ReplicacheContext,
    PartialSyncState,
    useSubscribe,
} from "@unclutter/library-components/dist/store";

export const SearchWorkerContent = createContext<MessagePort | null>(null);

export default function Index({ userId }: { userId: string }) {
    const rep = useReplicache({
        name: userId,
        mutators,
        accessors,
    });
    // // @ts-ignore
    // const partialSync: PartialSyncState | "NOT_RECEIVED_FROM_SERVER" | undefined = useSubscribe(
    //     rep,
    //     // @ts-ignore
    //     rep?.subscribe.getPartialSyncState(),
    //     "NOT_RECEIVED_FROM_SERVER"
    // );
    // useEffect(() => {
    //     console.log("partialSync", partialSync);
    //     if (partialSync !== "PARTIAL_SYNC_COMPLETE") {
    //         rep?.pull();
    //     }
    // }, [rep, partialSync]);

    return (
        <ReplicacheContext.Provider value={rep}>
            <NewApp />
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
                    destination: `/welcome`,
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
