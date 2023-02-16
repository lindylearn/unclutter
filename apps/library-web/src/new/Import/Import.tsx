import { getBrowserTypeWeb } from "@unclutter/library-components/dist/common";
import { importArticles, ImportProgress } from "@unclutter/library-components/dist/common/import";
import { getActivityColor } from "@unclutter/library-components/dist/components";
import { SettingsGroup } from "@unclutter/library-components/dist/components/Settings/SettingsGroup";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { reportEventPosthog } from "../../../common/metrics";

import { BookmarksImportButtons, BookmarksImportText } from "./Bookmarks";
import { CSVImportText, CSVImportButtons } from "./CSV";
import { InstapaperImportButtons, InstapaperImportText } from "./Instapaper";
import { PocketImportButtons, PocketImportText } from "./Pocket";
import { RaindropImportText, RaindropImportButtons } from "./Raindrop";

export function ImportSection({ rep, userInfo, darkModeEnabled }) {
    useEffect(() => {
        if (getBrowserTypeWeb() === "firefox") {
            importOptions["bookmarks"].iconFile = "firefox.svg";
            importOptions["bookmarks"].backgroundColor = "bg-orange-100 dark:bg-orange-900";
        }
    }, []);

    const [activeOption, setActiveOption] = useState<keyof typeof importOptions>();
    // handle url params
    const [isRedirect, setIsRedirect] = useState(false);
    useEffect(() => {
        const from = new URLSearchParams(window.location.search).get("from");
        if (from) {
            setActiveOption(from);
        }

        const isRedirect = new URLSearchParams(window.location.search).has("auth_redirect");
        if (isRedirect) {
            setIsRedirect(isRedirect);
            history.replaceState({}, "", `/import?from=${activeOption}`);
        }
    }, []);

    // update url, e.g. for the browser import to work
    useEffect(() => {
        setGenerateProgress(undefined);
        history.replaceState({}, "", `/import${activeOption ? `?from=${activeOption}` : ""}`);
    }, [activeOption]);

    const [error, setError] = useState<string>();
    const [generateProgress, setGenerateProgress] = useState<ImportProgress>();
    function startImport(data: ArticleImportSchema) {
        importArticles(rep, data, userInfo, setGenerateProgress);
        reportEventPosthog("startImport", {
            type: activeOption,
            articleCount: data.urls.length,
        });
    }

    return (
        <>
            <SettingsGroup
                title="Import articles"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M263 383C258.3 387.7 256 393.8 256 400s2.344 12.28 7.031 16.97c9.375 9.375 24.56 9.375 33.94 0l80-80c9.375-9.375 9.375-24.56 0-33.94l-80-80c-9.375-9.375-24.56-9.375-33.94 0s-9.375 24.56 0 33.94L302.1 296H24C10.75 296 0 306.8 0 320s10.75 24 24 24h278.1L263 383zM493.3 93.38l-74.63-74.64C406.6 6.742 390.3 0 373.4 0H192C156.7 0 127.1 28.66 128 64l.0078 168c.002 13.26 10.75 24 24 24s24-10.75 23.1-24L176 64.13c0-8.836 7.162-16 16-16h160L352 128c0 17.67 14.33 32 32 32h79.1v288c0 8.836-7.164 16-16 16H192c-8.838 0-16-7.164-16-16l-.002-40C176 394.7 165.3 384 152 384s-24 10.75-23.1 24L128 448c.002 35.34 28.65 64 64 64H448c35.2 0 64-28.8 64-64V138.6C512 121.7 505.3 105.4 493.3 93.38z"
                        />
                    </svg>
                }
                buttons={
                    <>
                        {Object.entries(importOptions).map(([id, option]) => (
                            <ImportButton
                                key={id}
                                active={!activeOption || id === activeOption}
                                {...option}
                                darkModeEnabled={darkModeEnabled}
                                onClick={() => {
                                    if (id === activeOption) {
                                        setActiveOption(undefined);
                                    } else {
                                        setActiveOption(id);
                                    }
                                }}
                            />
                        ))}
                    </>
                }
                animationIndex={2}
            >
                {/* <p>
                    Next to each highlight, you'll see related highlight that you saved previously.
                </p> */}
                <p>
                    The more articles in your library, the more value you'll get out Unclutter. So
                    import all the articles you already saved inside other apps!
                </p>
            </SettingsGroup>

            {activeOption && (
                <SettingsGroup
                    title={importOptions[activeOption].name}
                    icon={
                        <img
                            className="h-4 w-4"
                            src={`logos/${importOptions[activeOption].iconFile}`}
                        />
                    }
                    // className={importOptions[activeOption].backgroundColor}
                    buttons={
                        <>
                            {activeOption === "pocket" && (
                                <PocketImportButtons
                                    startImport={startImport}
                                    onError={setError}
                                    isRedirect={isRedirect}
                                    darkModeEnabled={darkModeEnabled}
                                    connectionStep={(customMessage) =>
                                        setGenerateProgress({ customMessage, targetArticles: 0 })
                                    }
                                />
                            )}
                            {activeOption === "bookmarks" && (
                                <BookmarksImportButtons
                                    startImport={startImport}
                                    onError={setError}
                                />
                            )}
                            {activeOption === "csv" && (
                                <CSVImportButtons startImport={startImport} onError={setError} />
                            )}
                            {activeOption === "instapaper" && (
                                <InstapaperImportButtons
                                    startImport={startImport}
                                    onError={setError}
                                    darkModeEnabled={darkModeEnabled}
                                />
                            )}
                            {activeOption === "raindrop" && (
                                <RaindropImportButtons
                                    startImport={startImport}
                                    onError={setError}
                                    darkModeEnabled={darkModeEnabled}
                                />
                            )}
                        </>
                    }
                    progress={generateProgress}
                    animationIndex={3}
                >
                    {activeOption === "pocket" && <PocketImportText />}
                    {activeOption === "bookmarks" && <BookmarksImportText />}

                    {activeOption === "csv" && <CSVImportText />}
                    {activeOption === "instapaper" && <InstapaperImportText />}
                    {activeOption === "raindrop" && <RaindropImportText />}
                </SettingsGroup>
            )}
        </>
    );
}

function ImportButton({ iconFile, name, backgroundColor, onClick, darkModeEnabled, active }) {
    return (
        <button
            className={clsx(
                "relative flex cursor-pointer select-none items-center rounded-md py-1 px-2 font-medium transition-all hover:scale-[97%]",
                true && "dark:text-stone-800",
                active ? "" : "opacity-50"
                // backgroundColor
            )}
            style={{ background: getActivityColor(3, darkModeEnabled) }}
            onClick={onClick}
        >
            <img className="mr-2 inline-block h-4 w-4" src={`logos/${iconFile}`} />
            {name}
        </button>
    );
}

export type ArticleImportSchema = {
    urls: string[];
    time_added?: number[];
    status?: number[];
    favorite?: number[];
};

type ImportOption = {
    name: string;
    iconFile: string;
    backgroundColor: string;
};
const importOptions: { [id: string]: ImportOption } = {
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
    bookmarks: {
        name: "Import Bookmarks",
        iconFile: "chrome.svg",
        backgroundColor: "bg-gray-200 dark:bg-gray-700",
    },
    csv: {
        name: "Import CSV",
        iconFile: "csv.svg",
        backgroundColor: "bg-green-100 dark:bg-green-900",
    },
};
