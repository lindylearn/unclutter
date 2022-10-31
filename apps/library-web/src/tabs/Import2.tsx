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
        <div className="font-text mx-auto mt-5 flex max-w-4xl flex-col gap-4 p-5 text-stone-900 dark:text-stone-200">
            <Head>
                <title>Import articles</title>
            </Head>

            {/* <p>Import articles or highlights to your library below.</p> */}

            <ImportTab userInfo={userInfo} reportEvent={reportEventPosthog} />
        </div>
    );
}
