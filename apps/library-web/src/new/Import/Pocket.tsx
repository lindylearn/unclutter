import { getPocketArticles, pocketConsumerKey } from "@unclutter/library-components/dist/common";
import type { ArticleImportSchema } from "@unclutter/library-components/dist/common/import";
import { SettingsButton } from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import ky from "ky";
import { useEffect } from "react";
import { reportEventPosthog } from "../../../common/metrics";

export const oauthRedirectUrl = "https://my.unclutter.it/sync?from=pocket&auth_redirect";

export function PocketImportText({}) {
    return (
        <p>Please authorize Unclutter to retrieve your Pocket list (the login will open twice).</p>
    );
}

export function PocketImportButtons({
    connectionStep,
    onError,
    startImport,
    isRedirect,
    disabled = false,
    darkModeEnabled,
}) {
    // see https://getpocket.com/developer/docs/authentication
    async function login() {
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
            onError(`Error connecting to Pocket: ${err.message}`);
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

    useEffect(() => {
        (async () => {
            if (!isRedirect) {
                return;
            }

            let access_token: string;
            try {
                connectionStep("Authenticating to Pocket...");

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
                    onError(`Error authorizing user: ${err.message}`);
                    return;
                }

                window.localStorage.setItem("is_pocket_retry", "true");

                login();
                return;
            }

            connectionStep("Fetching your Pocket list...");

            const articles = await getPocketArticles(access_token);
            if (!articles) {
                onError("Error fetching Pocket list");
                return;
            }

            const importData: ArticleImportSchema = {
                urls: articles.map(({ url }) => url),
                time_added: articles.map(({ time_added }) => time_added),
                status: articles.map(({ reading_progress }) => reading_progress),
                favorite: articles.map(({ is_favorite }) => (is_favorite ? 1 : 0)),
            };
            startImport(importData);
        })();
    }, [isRedirect]);

    return (
        <>
            <SettingsButton
                title="Log in with Pocket"
                onClick={login}
                darkModeEnabled={darkModeEnabled}
                reportEvent={reportEventPosthog}
            />
        </>
    );
}
