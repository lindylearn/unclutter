import { useUser } from "@supabase/auth-helpers-react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { getBrowserType } from "@unclutter/library-components/dist/common";
import { UITag } from "@unclutter/library-components/dist/components";
import BrowserBookmarksImportSettings from "./Bookmarks";
import CSVImportSettings from "./CSV";
import PocketImportSettings from "./Pocket";
import RaindropImportSettings from "./Raindrop";
import InstapaperImportSettings from "./Instapaper";
import { reportEventPosthog } from "../../../common/metrics";

const websocketUrl = "wss://api2.lindylearn.io:444/ws/clustering_results";
// const websocketUrl = "ws://localhost:8000/ws/clustering_results";
export const oauthRedirectUrl = "https://library.lindylearn.io/import?auth_redirect";
// export const oauthRedirectUrl = "http://localhost:3000/import?auth_redirect";

type ImportOption = {
    name: string;
    iconFile: string;
    backgroundColor: string;
};
const importOptions: { [id: string]: ImportOption } = {
    bookmarks: {
        name: "Import bookmarks",
        iconFile: "chrome.svg",
        backgroundColor: "bg-gray-200 dark:bg-gray-700",
    },
    pocket: {
        name: "Import Pocket",
        iconFile: "pocket.png",
        backgroundColor: "bg-red-100 dark:bg-red-900",
    },
    instapaper: {
        name: "Import Instapaper",
        iconFile: "instapaper.png",
        backgroundColor: "bg-gray-100 dark:bg-gray-800",
    },
    raindrop: {
        name: "Import Raindrop",
        iconFile: "raindrop.svg",
        backgroundColor: "bg-blue-100 dark:bg-blue-900",
    },
    csv: {
        name: "Import CSV",
        iconFile: "csv.svg",
        backgroundColor: "bg-green-100 dark:bg-green-900",
    },
};

type ProgressState = {
    is_error: boolean;
    is_connecting?: boolean;
    step: string;
    progress: number;
    time?: string;
    minutesRemaining?: number;
    minutesRemainingMessage?: number;
};

export type ArticleImportSchema = {
    urls: string[];
    time_added?: number[];
    status?: number[];
    favorite?: number[];
};

export default function ImportTab({}) {
    const { user } = useUser();

    useEffect(() => {
        if (getBrowserType() === "firefox") {
            importOptions["bookmarks"].iconFile = "firefox.svg";
            importOptions["bookmarks"].backgroundColor = "bg-orange-100 dark:bg-orange-900";
        }
    }, []);

    // local state
    const [activeOption, setActiveOption] = useState<keyof typeof importOptions>();
    const [lastProgress, setLastProgress] = useState<ProgressState>();

    // handle url params
    const [isRedirect, setIsRedirect] = useState(false);
    useEffect(() => {
        const provider = new URLSearchParams(window.location.search).get("provider");
        if (provider) {
            setActiveOption(provider);
        } else {
            setActiveOption(Object.keys(importOptions)[0]);
        }

        const isRedirect = new URLSearchParams(window.location.search).has("auth_redirect");
        if (isRedirect) {
            setIsRedirect(isRedirect);
            history.replaceState({}, "", `/import?provider=${activeOption}`);
        }
    }, []);

    // update url, e.g. for the browser import to work
    useEffect(() => {
        history.replaceState({}, "", `/import?provider=${activeOption}`);
    }, [activeOption]);

    // setup websocket and join user notifications
    const ws = useRef<WebSocket>();
    const [reconnectCounter, setReconnectCounter] = useState(0);
    useEffect(() => {
        if (!user?.id) {
            return;
        }

        ws.current = new WebSocket(websocketUrl);
        ws.current.onopen = () => {
            ws.current!.send(
                JSON.stringify({
                    event: "join_user",
                    user_id: user.id,
                })
            );
        };
        ws.current.onerror = (e) => {
            console.error("Websocket connection error, retrying in 10s");
            setTimeout(() => {
                setReconnectCounter((reconnectCounter) => reconnectCounter + 1);
            }, 10 * 1000);
        };
        ws.current.onclose = (e) => {
            if (e.code !== 3000) {
                // 3000 for termination after done
                console.error("Error: Connection closed unexpectedly");
            }
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "clustering.progress") {
                // ignore cached last progress if currently preparing for another import
                if (data.is_previous && lastProgress?.is_connecting) {
                    return;
                }

                if (data.minutesRemaining) {
                    data.minutesRemaining = Math.max(
                        0,
                        data.minutesRemaining - getMinutesAgo(data.time)
                    );
                }
                data.minutesRemainingMessage = data.minutesRemaining;

                if (data.is_error) {
                    setLastProgress((lastProgress) => ({
                        ...data,
                        progress: lastProgress?.progress || 0,
                    }));
                } else {
                    setLastProgress(data);
                }
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [user, reconnectCounter]);
    // timer to keep websocket alive and update remaining time estimate
    useEffect(() => {
        const pingTimer = setInterval(
            () => {
                ws.current!.send(JSON.stringify({ event: "ping" }));

                setLastProgress((lastProgress) => {
                    if (!lastProgress?.time || !lastProgress?.minutesRemainingMessage) {
                        return lastProgress;
                    }

                    setLastProgress({
                        ...lastProgress,
                        minutesRemaining: Math.max(
                            0,
                            lastProgress.minutesRemainingMessage - getMinutesAgo(lastProgress.time)
                        ),
                    });
                });
            },
            60 * 1000, // 1 min
            60 * 1000
        );

        return () => {
            clearInterval(pingTimer);
        };
    }, [ws]);

    function startImport(import_data: ArticleImportSchema) {
        ws.current?.send(
            JSON.stringify({
                event: "start_clustering",
                import_data,
            })
        );
        reportEventPosthog("startImport");
    }
    function connectionStep(message: string) {
        setLastProgress({
            is_error: false,
            is_connecting: true,
            step: message,
            progress: 0.05,
        });
    }
    function onError(message: string) {
        setLastProgress({
            is_error: true,
            is_connecting: true,
            step: message,
            progress: 0,
        });
        console.error(message);
        reportEventPosthog("importError", { message });
    }

    const disabled = false; //lastProgress && !lastProgress.is_error && lastProgress.progress !== 1;

    return (
        <div className="flex w-full max-w-4xl flex-col gap-3 p-5">
            <p>
                Below you can import articles from read-it-later lists or bookmarking apps.
                <br /> This also improves the quality of the generated topics.
            </p>
            <ul className="flex gap-3">
                {Object.entries(importOptions).map(([id, { name, iconFile, backgroundColor }]) => (
                    // @ts-ignore
                    <UITag
                        key={id}
                        title={name}
                        IconComponent={
                            <img className="mr-2 inline-block h-5 w-5" src={`/logos/${iconFile}`} />
                        }
                        className={backgroundColor}
                        focused={id === activeOption}
                        fadedOut={id !== activeOption}
                        onClick={() => setActiveOption(id)}
                    />
                ))}
            </ul>
            <div>
                <div
                    className={clsx(
                        "flex h-32 flex-col justify-between gap-2 rounded-lg p-3 shadow-inner transition-all",
                        activeOption && importOptions[activeOption].backgroundColor
                    )}
                >
                    {activeOption === "pocket" && (
                        <PocketImportSettings
                            connectionStep={connectionStep}
                            onError={onError}
                            startImport={startImport}
                            isRedirect={isRedirect}
                            disabled={disabled}
                        />
                    )}
                    {activeOption === "csv" && (
                        <CSVImportSettings
                            onError={onError}
                            startImport={startImport}
                            disabled={disabled}
                        />
                    )}
                    {activeOption === "bookmarks" && <BrowserBookmarksImportSettings />}
                    {activeOption === "raindrop" && (
                        <RaindropImportSettings
                            onError={onError}
                            startImport={startImport}
                            disabled={disabled}
                        />
                    )}
                    {activeOption === "instapaper" && (
                        <InstapaperImportSettings
                            onError={onError}
                            startImport={startImport}
                            disabled={disabled}
                        />
                    )}
                </div>
                <div className="mt-3 mb-5 flex flex-col items-start gap-2">
                    <div className=" flex w-full justify-between">
                        <div>
                            {lastProgress?.step || " "}
                            {lastProgress?.progress == 1.0 && (
                                <span>
                                    {" 🎉 "}You can now{" "}
                                    <Link href="/">
                                        <a className="inline-block cursor-pointer font-bold transition-all hover:rotate-2">
                                            browse
                                        </a>
                                    </Link>{" "}
                                    your new articles or start another import.
                                </span>
                            )}
                        </div>
                        <div>
                            {lastProgress?.minutesRemaining
                                ? `about ${lastProgress?.minutesRemaining} minute${
                                      lastProgress?.minutesRemaining !== 1 ? "s" : ""
                                  } left`
                                : ""}
                        </div>
                    </div>
                    <div
                        className={clsx(
                            "dark:bg-backgroundDark h-2 w-full rounded-lg bg-white",
                            (!lastProgress || lastProgress?.progress == 0) && "opacity-0"
                        )}
                    >
                        <div
                            className="bg-lindy dark:bg-lindyDark h-full rounded-lg shadow-sm transition-all"
                            style={{
                                width: `${(lastProgress?.progress || 0) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function getMinutesAgo(time: string): number {
    const now = new Date();
    const diffenceMs = now.getTime() - new Date(time).getTime();
    return Math.round(diffenceMs / (1000 * 60));
}
