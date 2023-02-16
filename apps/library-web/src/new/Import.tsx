import { useUser } from "@supabase/auth-helpers-react";
import { useAutoDarkMode } from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";
import {
    Article,
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { useRouter } from "next/router";
import { reportEventPosthog } from "../../common/metrics";
import { GenerateSection } from "./Import/Generate";
import { ImportSection } from "./Import/Import";
import Head from "next/head";

export default function NewImportTab() {
    const router = useRouter();
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();
    // @ts-ignore
    const userInfo = useSubscribe<UserInfo>(rep, rep?.subscribe.getUserInfo(), undefined);
    const darkModeEnabled = useAutoDarkMode();

    useEffect(() => {
        if (!rep || !userInfo || !user) {
            return;
        }
        if (userInfo.aiEnabled) {
            // everything set up
            return;
        }
    }, [rep, userInfo]);

    // const [sampleArticles, setSampleArticles] = useState<Article[]>([]);
    // useEffect(() => {
    //     rep?.query.listRecentArticles().then((articles) => {
    //         const queueArticles = articles.filter((a) => a.is_queued);
    //         if (queueArticles.length >= 3) {
    //             setSampleArticles(queueArticles.slice(0, 4));
    //         } else {
    //             setSampleArticles(articles.slice(0, 4));
    //         }
    //     });
    // }, [rep]);

    if (!userInfo) {
        return <></>;
    }
    return (
        <div className="animate-fadein flex flex-col gap-4">
            <Head>
                <title>Import</title>
            </Head>

            <GenerateSection rep={rep} userInfo={userInfo} darkModeEnabled={darkModeEnabled} />

            <ImportSection rep={rep} userInfo={userInfo} darkModeEnabled={darkModeEnabled} />
        </div>
    );
}
