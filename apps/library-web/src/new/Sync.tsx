import { useUser } from "@supabase/auth-helpers-react";
import { getUnclutterVersion, useAutoDarkMode } from "@unclutter/library-components/dist/common";
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
import PocketSyncSection from "./Import/PocketSync";

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

    const [unclutterVersion, setUnclutterVersion] = useState<string>();
    useEffect(() => {
        getUnclutterVersion().then(setUnclutterVersion);
    }, []);

    const pocketSyncSupported = unclutterVersion && unclutterVersion >= "1.7.4";

    if (!userInfo) {
        return <></>;
    }
    return (
        <div className="animate-fadein flex flex-col gap-4">
            <GenerateSection userInfo={userInfo} darkModeEnabled={darkModeEnabled} />

            {pocketSyncSupported && (
                <PocketSyncSection userInfo={userInfo} darkModeEnabled={darkModeEnabled} />
            )}

            <HypothesisSyncSection userInfo={userInfo} darkModeEnabled={darkModeEnabled} />

            <ImportSection
                userInfo={userInfo}
                darkModeEnabled={darkModeEnabled}
                pocketSyncSupported={pocketSyncSupported}
            />
        </div>
    );
}
