import { useUser } from "@supabase/auth-helpers-react";
import { useAutoDarkMode } from "@unclutter/library-components/dist/common";
import { useContext, useEffect, useState } from "react";
import {
    Article,
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { GenerateSection } from "./Generate";
import { ImportSection } from "./Import/Import";
import HypothesisSyncSection from "./Import/Hypothesis";

export default function SyncTab() {
    const rep = useContext(ReplicacheContext);
    const { user } = useUser();
    // @ts-ignore
    const userInfo = useSubscribe<UserInfo>(rep, rep?.subscribe.getUserInfo(), undefined);
    const darkModeEnabled = useAutoDarkMode();

    useEffect(() => {
        if (!rep || !userInfo || !user) {
            return;
        }
        if (userInfo?.aiEnabled) {
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
            <GenerateSection userInfo={userInfo} darkModeEnabled={darkModeEnabled} />
            <HypothesisSyncSection userInfo={userInfo} darkModeEnabled={darkModeEnabled} />
            <ImportSection userInfo={userInfo} darkModeEnabled={darkModeEnabled} />
        </div>
    );
}
