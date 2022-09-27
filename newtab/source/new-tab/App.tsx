import React, { useEffect, useLayoutEffect, useState } from "react";
import {
    LindyIcon,
    TabbedContainer,
    useTabInfos,
} from "@unclutter/library-components/dist/components";
import { useReplicache } from "@unclutter/replicache-nextjs/lib/frontend";
import {
    Article,
    mutators,
    ReplicacheContext,
} from "@unclutter/library-components/dist/store";

import browser from "../common/polyfill";
import "./app.css";
import "./ArticleDropdownMenu.css";
import "./ArticlePreview.css";
import { settingsStore, userInfoStore, useSettings } from "../common/settings";
import { reportEventContentScript } from "../common/messaging";
import { googleSearchDomains } from "../common/util";

export default function App() {
    const userAuth = useSettings(userInfoStore);
    const rep = useReplicache({
        name: userAuth?.userId,
        mutators,
        // apiHost: "http://localhost:3000",
        apiHost: "https://library.lindylearn.io",
        auth: userAuth?.webJwt,
    });

    const [searchInstalled, setSearchInstalled] = useState(null);
    browser.runtime
        .sendMessage({
            event: "isSearchInstalled",
        })
        .then(setSearchInstalled);

    if (userAuth && Object.keys(userAuth).length === 0) {
        return <LibraryLoginButton />;
    }

    if (searchInstalled === false) {
        return <InstallSearch setSearchInstalled={setSearchInstalled} />;
    }

    return (
        <ReplicacheContext.Provider value={rep}>
            <ArticleSection />
        </ReplicacheContext.Provider>
    );
}

function ArticleSection({}) {
    const [tabInfos, allArticlesCount] = useTabInfos(7);

    const settings = useSettings(settingsStore);
    const [initialIndex, setInitialIndex] = useState<number | null>();
    useLayoutEffect(() => {
        if (tabInfos && allArticlesCount > 0 && settings) {
            if (settings.newtabActiveGroupKey === null) {
                setInitialIndex(null);
                return;
            }
            const index = tabInfos?.findIndex(
                (tab) => tab.key === settings.newtabActiveGroupKey
            );
            if (tabInfos[index]) {
                setInitialIndex(index);
            } else {
                setInitialIndex(0);
            }
        }
    }, [tabInfos, settings]);

    return (
        <div className="font-text text-base">
            {tabInfos && allArticlesCount > 0 && initialIndex !== undefined && (
                <TabbedContainer
                    tabInfos={tabInfos}
                    articleRows={1}
                    initialIndex={initialIndex}
                    setInitialIndex={(index) =>
                        settingsStore.set({
                            newtabActiveGroupKey: tabInfos[index]?.key || null,
                        })
                    }
                    reportEvent={reportEventContentScript}
                />
            )}
        </div>
    );
}

function LibraryLoginButton() {
    return (
        <a
            className="bg-lindy dark:bg-lindyDark mx-auto flex w-max cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 shadow transition-all hover:scale-95 dark:text-black"
            href="https://library.lindylearn.io/login"
            onClick={() => reportEventContentScript("clickLogin")}
        >
            <LindyIcon className="w-6" />
            <span className="font-title text-base leading-none">
                Login to Unclutter Library
            </span>
        </a>
    );
}

function InstallSearch({ setSearchInstalled }) {
    async function onClick() {
        await browser.permissions.request({
            permissions: ["scripting"],
            origins: googleSearchDomains,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await browser.runtime.sendMessage({
            event: "activateSearchIntegration",
        });
        setSearchInstalled(true);
    }

    return (
        <div
            className="bg-lindy dark:bg-lindyDark mx-auto flex w-max cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 shadow transition-all hover:scale-95 dark:text-black"
            onClick={onClick}
        >
            <LindyIcon className="w-6" />
            <span className="font-title text-base leading-none">
                Activate Google integration
            </span>
        </div>
    );
}
