import React, { useLayoutEffect, useMemo, useState } from "react";
import {
    LindyIcon,
    TabbedContainer,
    useTabInfos,
} from "@unclutter/library-components/dist/components";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";
import {
    reportEventContentScript,
    ReplicacheProxy,
    getUnclutterExtensionId,
} from "@unclutter/library-components/dist/common";

import { settingsStore, useSettings } from "../common/settings";

import "@unclutter/library-components/styles/globals.css";
import "@unclutter/library-components/styles/ArticlePreview.css";
import "@unclutter/library-components/styles/ProgressCircle.css";
import "./app.css";

export default function App() {
    // send messages to main Unclutter extension directly by passing its id
    const rep = useMemo<ReplicacheProxy>(
        () => new ReplicacheProxy(getUnclutterExtensionId()),
        []
    );

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <ArticleSection />
        </ReplicacheContext.Provider>
    );
}

function ArticleSection({}) {
    const [tabInfos, allArticlesCount] = useTabInfos(7 - 1); // leave space for 'hide' button

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
                    reportEvent={(...args) =>
                        reportEventContentScript(
                            ...args,
                            getUnclutterExtensionId()
                        )
                    }
                />
            )}
        </div>
    );
}
