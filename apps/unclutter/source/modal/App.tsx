import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { LibraryModalPage } from "@unclutter/library-components/dist/components/Modal";

import { LibraryState } from "../common/schema";
import {
    ReplicacheProxy,
    reportEventContentScript,
} from "../content-script/messaging";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";

export default function App({
    darkModeEnabled,
    articleUrl,
}: {
    darkModeEnabled: string;
    articleUrl: string;
}) {
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(), []);
    const [libraryState, setLibraryState] = useState<LibraryState | null>(null);
    useLayoutEffect(() => {
        window.addEventListener("message", ({ data }) => {
            if (data.event === "setLibraryState") {
                setLibraryState(data.libraryState);
            } else if (data.event === "closeLibraryModal") {
                closeModal();
            }
        });
        window.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                closeModal();
            }
        });

        // initial state set in messaging.ts
        setLibraryState(libraryState || window["libraryState"] || null);

        window.top.postMessage({ event: "modalAppReady" }, "*");
    }, []);

    const [showModal, setShowModal] = useState<boolean | null>(null);
    useEffect(() => {
        // leave time to render graph before triggering animation
        setTimeout(() => {
            setShowModal(true);
        }, 50);
    }, []);
    function closeModal() {
        setShowModal(false);
        // play out-animation before destroying iframe
        setTimeout(() => {
            window.top.postMessage({ event: "destroyLibraryModal" }, "*");
        }, 300);
    }

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <LibraryModalPage
                darkModeEnabled={darkModeEnabled === "true"} // convert string to bool
                relatedLinkCount={libraryState?.topicProgress?.linkCount}
                currentArticle={
                    libraryState?.libraryInfo?.article.url || articleUrl
                }
                initialTopic={libraryState?.libraryInfo?.topic}
                graph={libraryState?.graph}
                isVisible={showModal}
                closeModal={closeModal}
                reportEvent={reportEventContentScript}
            />
        </ReplicacheContext.Provider>
    );
}
