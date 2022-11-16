import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
    FeedbackModalPage,
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
import { getDistinctId, getPageReportCount } from "../common/storage";
import { getInitialInstallVersion } from "../common/updateMessages";
import { getAllElementBlockSelectors } from "../common/storage2";

export default function App({
    darkModeEnabled,
    articleUrl,
    initialTab,
    isFeedbackModal,
}: {
    darkModeEnabled: string;
    articleUrl: string;
    initialTab?: string;
    isFeedbackModal?: string;
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

    const [feedbackUserInfo, setFeedbackUserInfo] = useState<object>();
    useEffect(() => {
        if (isFeedbackModal) {
            (async () => {
                setFeedbackUserInfo({
                    distinctId: await getDistinctId(),
                    installVersion: await getInitialInstallVersion(),
                    pageReports: await getPageReportCount(),
                    elementBlocks: (await getAllElementBlockSelectors()).length,
                    articleCount: libraryState?.readingProgress?.articleCount,
                    annotationCount: libraryState?.readingProgress?.annotationCount
                });
            })()
        }
    }, [isFeedbackModal, libraryState])
    function onSubmitFeedback() {
        window.top.postMessage({ event: "onSubmitFeedback" }, "*");
    }

    if (isFeedbackModal === "true") {
        return (
            <ModalContext.Provider value={{ isVisible: showModal, closeModal }}>
                <FeedbackModalPage userInfo={feedbackUserInfo} onSubmit={onSubmitFeedback} reportEvent={reportEventContentScript}/>
            </ModalContext.Provider>
        );
    }

    // TODO move userInfo to query params to render faster?
    if (!libraryState?.userInfo || (isFeedbackModal && !feedbackUserInfo)) {
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
