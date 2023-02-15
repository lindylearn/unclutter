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
import {
    SettingsButton,
    SettingsGroup,
} from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import { reportEventPosthog } from "../../common/metrics";
import { GenerateSection } from "./Import/Generate";
import { ImportSection } from "./Import/Import";
import Head from "next/head";
import { StaticArticleList } from "@unclutter/library-components/dist/components";

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

        if (userInfo.stripeId) {
            // user likely cancelled subscription
            router.push("/welcome");
            return;
        } else {
            // signup didn not work yet?
            rep.mutate.updateUserInfo({ aiEnabled: true });
        }

        reportEventPosthog("enableSmartReading", {
            $set: {
                aiEnabled: true,
                stripeId: userInfo.stripeId,
            },
        });
    }, [rep, userInfo]);

    const [sampleArticles, setSampleArticles] = useState<Article[]>([]);
    useEffect(() => {
        rep?.query.listRecentArticles().then((articles) => {
            const queueArticles = articles.filter((a) => a.is_queued);
            if (queueArticles.length >= 3) {
                setSampleArticles(queueArticles.slice(0, 4));
            } else {
                setSampleArticles(articles.slice(0, 4));
            }
        });
    }, [rep]);

    if (!userInfo) {
        return <></>;
    }
    return (
        <div className="animate-fadein flex flex-col gap-4">
            <Head>
                <title>Import articles</title>
            </Head>

            <GenerateSection rep={rep} userInfo={userInfo} darkModeEnabled={darkModeEnabled} />

            <ImportSection rep={rep} userInfo={userInfo} darkModeEnabled={darkModeEnabled} />
        </div>
    );
}
