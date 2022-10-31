import { useUser } from "@supabase/auth-helpers-react";
import {
    setUnclutterLibraryAuth,
    checkHasSubscription,
    sendMessage,
    clusterLibraryArticles,
} from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";

import { ReplicacheContext, useSubscribe } from "@unclutter/library-components/dist/store";
import Head from "next/head";
import { reportEventPosthog } from "../../common/metrics";
import Link from "next/link";
import { LindyIcon } from "@unclutter/library-components/dist/components";

export default function Welcome2Tab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();

    useEffect(() => {
        (async () => {
            if (!rep || !user || !user.email) {
                return;
            }

            const userInfo = await rep.query.getUserInfo(); // get latest version
            if (!userInfo) {
                // new user signup
                console.log("new user signup");

                // fetch email subscription status
                const onPaidPlan = await checkHasSubscription(user.id, user.email);
                const trialEnabled = false;
                await rep.mutate.updateUserInfo({
                    id: user.id,
                    name: undefined,
                    signinProvider: user.app_metadata.provider as any,
                    email: user.email,
                    accountEnabled: true,
                    trialEnabled,
                    onPaidPlan,
                });

                if (onPaidPlan || trialEnabled) {
                    await clusterLibraryArticles([], user.id);
                }
            }

            // sendMessage({ event: "requestEnhance" });

            // init extension replicache after insert
            setUnclutterLibraryAuth(user.id);
        })();
    }, [rep, user]);

    const userInfo = useSubscribe(rep, rep?.subscribe.getUserInfo(), null);
    if (!userInfo) {
        return <></>;
    }

    return (
        <div className="font-text mx-auto mt-5 flex max-w-3xl flex-col gap-4 p-5 text-stone-900 dark:text-stone-200">
            <Head>
                <title>Your Unclutter Library</title>
            </Head>
            {/* <header className="font-title fixed top-3 left-3 flex gap-2 text-2xl font-bold">
                <LindyIcon className="w-8" /> Unclutter
            </header> */}

            <h1>You successfully created an Unclutter account!</h1>
            <p>
                From now on, your articles and highlights are backed-up and synchronized between
                your devices. You can also{" "}
                <a
                    className="inline-block cursor-pointer font-medium underline underline-offset-2 transition-all hover:scale-[98%]"
                    href="/import"
                >
                    import articles to your library
                </a>
                .
            </p>
        </div>
    );
}
