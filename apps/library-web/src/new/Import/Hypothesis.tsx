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

export default function HypothesisSyncSection({ userInfo, darkModeEnabled }) {
    const rep = useContext(ReplicacheContext);

    // fetch saved info
    // @ts-ignore
    const syncState: SyncState | undefined = useSubscribe(
        rep,
        // @ts-ignore
        rep?.subscribe.getSyncState("hypothesis"),
        undefined
    );
    const [token, setToken] = useState("");
    useEffect(() => {
        if (!syncState) {
            return;
        }
        if (!token) {
            setToken(syncState.api_token);
        }

        // rep?.mutate.deleteSyncState("hypothesis");
    }, [syncState]);

    const [error, setError] = useState<string>();
    async function changeToken(token: string) {
        if (!rep) {
            return;
        }
        setToken(token);

        const userName = await getHypothesisUsername(token);
        if (userName) {
            setError(undefined);
            const newSyncState: SyncState = {
                id: "hypothesis",
                api_token: token,
                username: userName,
            };
            if (!syncState) {
                await rep.mutate.putSyncState(newSyncState);
            } else {
                await rep.mutate.updateSyncState(newSyncState);
            }

            await sendMessage({ event: "initSync", syncState: newSyncState });
        } else {
            setError("API token is invalid");
        }
    }

    const [isOpen, setIsOpen] = useState(false);

    let progress: ImportProgress | undefined = undefined;
    if (!token) {
        progress = undefined;
    } else if (error) {
        progress = {
            targetArticles: 0,
            customMessage: "Your API token is invalid",
        };
    } else if (syncState) {
        progress = {
            finished: !!syncState.last_download,
            targetArticles: 0,
            customMessage: !syncState.last_download
                ? "Synchronizing your highlights..."
                : `Last synchronized ${getRelativeTime(syncState.last_download, false, false)}`,
        };
    }

    return (
        <SettingsGroup
            title="Sync with Hypothes.is"
            icon={<img className="h-4 w-4 grayscale" src="logos/hypothesis.svg" />}
            buttons={
                syncState || isOpen ? (
                    <>
                        <SettingsButton
                            title="Create account"
                            href="https://web.hypothes.is/start/?ref=lindylearn.io"
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEventPosthog}
                        />
                        <SettingsButton
                            title="Get API token"
                            href="https://hypothes.is/account/developer"
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEventPosthog}
                        />
                    </>
                ) : (
                    <SettingsButton
                        title="Configure sync"
                        onClick={() => setTimeout(() => setIsOpen(true), 100)}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEventPosthog}
                    />
                )
            }
            progress={progress}
        >
            <p>
                Synchronize highlights with your hypothes.is account to annotate outside of
                Unclutter and to import highlights into note-taking apps including Obsidian.
            </p>
            {(syncState || isOpen) && (
                <>
                    <input
                        className="flex-grow rounded-md bg-white py-1 px-2 outline-none dark:bg-[#212121]"
                        placeholder="Your hypothes.is API token"
                        spellCheck="false"
                        value={token}
                        onChange={(e) => changeToken(e.target.value)}
                    />
                </>
            )}
        </SettingsGroup>
    );
}
