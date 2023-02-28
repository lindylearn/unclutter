import ky from "ky";
import {
    ArticleImportSchema,
    importArticles,
    ImportProgress,
} from "@unclutter/library-components/dist/common/import";
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
import {
    getPocketArticles,
    getRelativeTime,
    pocketConsumerKey,
    sendMessage,
} from "@unclutter/library-components/dist/common";

export const oauthRedirectUrl = "https://my.unclutter.it/sync?pocket_auth_redirect";
// export const oauthRedirectUrl = "http://localhost:3000/sync?pocket_auth_redirect";

export default function PocketSyncSection({ userInfo, darkModeEnabled }) {
    const rep = useContext(ReplicacheContext);

    const [progress, setProgress] = useState<ImportProgress>();

    // fetch saved info
    const syncState = useSubscribe<SyncState>(rep, rep?.subscribe.getSyncState("pocket"));
    useEffect(() => {
        // dev test
        // rep?.mutate.putSyncState({
        //     id: "pocket",
        //     api_token: ""
        // });
        // rep?.mutate.deleteSyncState("pocket");

        if (!syncState) {
            return;
        }
        setProgress({
            finished: !!syncState.last_download,
            targetArticles: 0,
            customMessage: !syncState.last_download
                ? "Synchronizing your articles..."
                : `Last synchronized ${getRelativeTime(syncState.last_download, false, false)}`,
        });

        // getPocketArticles(syncState?.api_token).then(console.log);
    }, [syncState]);

    // first auth click
    // see https://getpocket.com/developer/docs/authentication
    async function login() {
        if (syncState) {
            return;
        }

        const pocketRedirectUrl = `${oauthRedirectUrl}&provider=pocket`;
        let code: string;
        try {
            const response = (await ky
                .post(`/api/pocket/oauth/request`, {
                    json: {
                        consumer_key: pocketConsumerKey,
                        redirect_uri: pocketRedirectUrl,
                    },
                    retry: 0,
                })
                .json()) as any;
            code = response.code;
        } catch (err) {
            setProgress({ customMessage: `Error connecting to Pocket`, targetArticles: 0 });
            return;
        }

        window.localStorage.setItem("oauth_code", code);
        window.open(
            `https://getpocket.com/auth/authorize?request_token=${code}&redirect_uri=${encodeURIComponent(
                pocketRedirectUrl
            )}`,
            "_self"
        );
    }

    // on redirect from pocket auth
    const [isRedirect, setIsRedirect] = useState(false);
    useEffect(() => {
        const isRedirect = new URLSearchParams(window.location.search).has("pocket_auth_redirect");
        setIsRedirect(isRedirect);
        if (isRedirect) {
            setIsRedirect(isRedirect);
            history.replaceState({}, "", `/sync`);
        }
    }, []);
    useEffect(() => {
        (async () => {
            if (!isRedirect || !rep) {
                return;
            }

            let access_token: string;
            try {
                setProgress({ customMessage: `Authenticating to Pocket...`, targetArticles: 0 });

                const code = window.localStorage.getItem("oauth_code");
                window.localStorage.removeItem("oauth_code");

                const response = (await ky
                    .post(`/api/pocket/oauth/authorize`, {
                        json: {
                            consumer_key: pocketConsumerKey,
                            code: code,
                        },
                        retry: 0,
                    })
                    .json()) as any;
                access_token = response.access_token;
            } catch (err) {
                // the first request may return a 500 error
                if (window.localStorage.getItem("is_pocket_retry")) {
                    setProgress({ customMessage: `Error authorizing user`, targetArticles: 0 });
                    return;
                }

                window.localStorage.setItem("is_pocket_retry", "true");

                login();
                return;
            }

            // do initial import manually with progress updates
            setProgress({ customMessage: `Fetching your Pocket list...`, targetArticles: 0 });
            const newDownload = new Date();
            const articles = await getPocketArticles(access_token);
            if (!articles) {
                setProgress({ customMessage: `Error fetching Pocket list`, targetArticles: 0 });
                return;
            }

            const importData: ArticleImportSchema = {
                urls: articles.map(({ url }) => url),
                time_added: articles.map(({ time_added }) => time_added),
                status: articles.map(({ reading_progress }) => reading_progress),
                favorite: articles.map(({ is_favorite }) => (is_favorite ? 1 : 0)),
            };
            await importArticles(rep, importData, userInfo, setProgress);

            // now set state and trigger sync
            const newSyncState: SyncState = {
                id: "pocket",
                api_token: access_token,
                last_download: newDownload.getTime(),
            };
            await rep.mutate.putSyncState(newSyncState);
            await sendMessage({ event: "initSync", syncState: newSyncState });
        })();
    }, [isRedirect]);

    return (
        <SettingsGroup
            title="Sync with Pocket"
            icon={<img className="h-4 w-4 grayscale" src="logos/pocket.png" />}
            buttons={
                !syncState && (
                    <>
                        <SettingsButton
                            title="Log in with Pocket"
                            onClick={login}
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEventPosthog}
                        />
                    </>
                )
            }
            progress={progress}
        >
            <p>
                Save articles outside of Unclutter, read on mobile, and import articles you've
                already got saved in your Pocket account.
            </p>
        </SettingsGroup>
    );
}
