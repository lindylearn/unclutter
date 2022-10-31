import ky from "ky";
import React, { useEffect } from "react";
import { ArticleImportSchema, oauthRedirectUrl } from "./_Import";

const pocketImportBatchSize = 1000; // work around vercel functions timeout
const pocketConsumerKey = "103045-348c15882b98fde8379db28";
export default function PocketImportSettings({
    connectionStep,
    onError,
    startImport,
    isRedirect,
    disabled,
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
                connectionStep("Connecting to Pocket...");

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

            let import_data: ArticleImportSchema = {
                urls: [],
                time_added: [],
                status: [],
                favorite: [],
            };
            try {
                connectionStep("Fetching Pocket list...");
                let hasMore = true;
                while (hasMore) {
                    const batch = (await ky
                        .post(`/api/pocket/get`, {
                            json: {
                                consumer_key: pocketConsumerKey,
                                access_token: access_token,
                                count: pocketImportBatchSize,
                                offset: import_data.urls.length,
                            },
                            timeout: 10000, // max for vercel standard plan
                            retry: 0,
                        })
                        .json()) as ArticleImportSchema;

                    import_data.urls = import_data.urls.concat(batch.urls);
                    import_data.time_added = import_data.time_added!.concat(batch.time_added!);
                    import_data.status = import_data.status!.concat(batch.status!);
                    import_data.favorite = import_data.favorite!.concat(batch.favorite!);

                    hasMore = batch.urls.length > 0;
                }
            } catch (err) {
                onError(`Error fetching Pocket list: ${err.message}`);
                return;
            }

            startImport(import_data);
        })();
    }, [isRedirect]);

    return (
        <div className="flex justify-center p-3">
            <button
                className="bg-background dark:bg-backgroundDark rounded-md px-3 py-1 shadow-sm transition-all hover:scale-[97%] disabled:cursor-not-allowed"
                onClick={login}
                disabled={disabled}
            >
                Log in with Pocket
            </button>
        </div>
    );
}
