import { useContext } from "react";

import { ReplicacheContext, useSubscribe } from "@unclutter/library-components/dist/store";
import { ImportTab } from "@unclutter/library-components/dist/components";
import Head from "next/head";
import { reportEventPosthog } from "../../common/metrics";

export default function Import2Tab() {
    const rep = useContext(ReplicacheContext);

    const userInfo = useSubscribe(rep, rep?.subscribe.getUserInfo(), null);

    if (!userInfo) {
        return <></>;
    }

    return (
        <div className="font-text mx-auto mt-3 flex max-w-4xl flex-col gap-4 p-5 text-stone-900 dark:text-stone-200">
            <Head>
                <title>Import articles</title>
            </Head>

            <p className="">
                Here you can import articles to your Unclutter library. Once they're analysed you'll
                find them inside the extension, just like any article you added so far. The bigger
                your library, the better it works.
            </p>

            <p className="mb-3">
                If you'd like to sync changes from Unclutter back to these other services, please
                track{" "}
                <a
                    className="inline-block cursor-pointer font-medium underline underline-offset-2 transition-all hover:scale-[98%]"
                    href="https://unclutter.canny.io/library/p/sync-library-changes"
                    target="_blank"
                    rel="noreferrer"
                >
                    this roadmap item
                </a>
                .
            </p>

            <ImportTab userInfo={userInfo} reportEvent={reportEventPosthog} />
        </div>
    );
}
