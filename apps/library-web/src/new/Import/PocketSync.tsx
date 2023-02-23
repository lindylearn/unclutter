import { getRelativeTime, sendMessage } from "@unclutter/library-components/dist/common";
import { ImportProgress } from "@unclutter/library-components/dist/common/import";
import { getHypothesisUsername } from "@unclutter/library-components/dist/common/sync/hypothesis";
import {
    SettingsButton,
    SettingsGroup,
} from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import {
    ReplicacheContext,
    SyncState,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import { useContext, useEffect, useState } from "react";
import { reportEventPosthog } from "../../../common/metrics";

export default function PocketSyncSection({ userInfo, darkModeEnabled }) {
    const rep = useContext(ReplicacheContext);

    // fetch saved info
    // @ts-ignore
    const syncState: SyncState | undefined = useSubscribe(
        rep,
        // @ts-ignore
        rep?.subscribe.getSyncState("pocket"),
        undefined
    );

    let progress: ImportProgress | undefined = undefined;

    return (
        <SettingsGroup
            title="Sync with Pocket"
            icon={<img className="h-4 w-4 grayscale" src="logos/pocket.png" />}
            buttons={
                !syncState && (
                    <>
                        <SettingsButton
                            title="Log in with Pocket"
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEventPosthog}
                        />
                    </>
                )
            }
            progress={progress}
        >
            <p>
                Please authorize Unclutter to retrieve your Pocket list (the login will open twice).
            </p>
        </SettingsGroup>
    );
}
