import { useUser } from "@supabase/auth-helpers-react";
import {
    setUnclutterLibraryAuth,
    checkHasSubscription,
    sendMessage,
} from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";

import { ReplicacheContext, useSubscribe } from "@unclutter/library-components/dist/store";
import Head from "next/head";

export default function Welcome2Tab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();

    useEffect(() => {
        (async () => {
            if (user && user.email) {
                console.log(user);

                // fetch email subscription status
                const onPaidPlan = await checkHasSubscription(user.id, user.email);

                // create userInfo
                await rep?.mutate.updateUserInfo({
                    id: user.id,
                    name: undefined,
                    signinProvider: user.app_metadata.provider as any,
                    email: user.email,
                    accountEnabled: true,
                    trialEnabled: false,
                    onPaidPlan,
                });

                sendMessage({ event: "requestEnhance" });

                // init extension replicache after insert
                setUnclutterLibraryAuth(user.id);
            }
        })();
    }, [user]);

    const userInfo = useSubscribe(rep, rep?.subscribe.getUserInfo(), null);

    return (
        <div className="font-text mb-10 flex flex-col gap-3 p-5 text-stone-900 dark:text-stone-200">
            <Head>
                <title>Your Unclutter Library</title>
            </Head>

            <h1>You successfully created an Unclutter account!</h1>
            <p>
                From now on, your articles and highlights are backed-up and synchronized between
                your devices. Open your library to import or export articles.
            </p>
        </div>
    );
}
