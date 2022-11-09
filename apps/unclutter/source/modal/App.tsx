import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
    LibraryModalPage,
    ModalContext,
} from "@unclutter/library-components/dist/components/Modal";
import { LocalScreenshotContext } from "@unclutter/library-components/dist/components";

import { LibraryState } from "../common/schema";
import {
    getLocalScreenshot,
    ReplicacheProxy,
    reportEventContentScript,
} from "@unclutter/library-components/dist/common/messaging";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";

export default function App({
    darkModeEnabled,
    articleUrl,
    initialTab,
}: {
    darkModeEnabled: string;
    articleUrl: string;
    initialTab?: string;
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
            if (e.key === "Tab" || e.key === "Escape") {
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
        window.top.postMessage({ event: "destroyLibraryModal" }, "*");
    }

    // TODO move userInfo to query params to render faster?
    if (!libraryState?.userInfo) {
        return <></>;
    }

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <LocalScreenshotContext.Provider
                value={!libraryState.userInfo.accountEnabled ? getLocalScreenshot : null}
            >
                <ModalContext.Provider value={{ isVisible: showModal, closeModal }}>
                    <LibraryModalPage
                        userInfo={libraryState?.userInfo}
                        darkModeEnabled={darkModeEnabled === "true"} // convert string to bool
                        showSignup={libraryState.showLibrarySignup}
                        relatedLinkCount={libraryState?.linkCount}
                        currentArticle={libraryState?.libraryInfo?.article.id}
                        initialSubscription={libraryState?.feed}
                        initialTopic={libraryState?.libraryInfo?.topic}
                        initialTab={initialTab}
                        graph={libraryState?.graph}
                        reportEvent={reportEventContentScript}
                    />
                </ModalContext.Provider>
            </LocalScreenshotContext.Provider>
        </ReplicacheContext.Provider>
    );
}
