import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    getActivityColor,
    ReadingProgress,
    DraggableArticleList,
    DraggableContext,
    ArticleListsCache,
    LocalScreenshotContext,
    ModalContext,
    useTabInfos,
    useArticleListsCache,
    ArticleGroup,
} from "@unclutter/library-components/dist/components";
import {
    ReadingProgress as ReadingProgressType,
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import {
    reportEventContentScript,
    ReplicacheProxy,
    getUnclutterExtensionId,
    getLocalScreenshot,
    useAutoDarkMode,
} from "@unclutter/library-components/dist/common";
import { settingsStore, useSettings } from "../common/settings";
import NewTabModal from "./Modal";

import "@unclutter/library-components/styles/globals.css";
import "@unclutter/library-components/styles/ArticlePreview.css";
import "@unclutter/library-components/styles/ProgressCircle.css";
import "./app.css";
import clsx from "clsx";

export default function App() {
    // send messages to main Unclutter extension directly by passing its id
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(getUnclutterExtensionId()), []);

    function reportEvent(name: string, data: object = {}) {
        reportEventContentScript(name, data, getUnclutterExtensionId());
    }

    const [userInfo, setUserInfo] = useState<UserInfo>();
    useEffect(() => {
        rep?.query.getUserInfo().then((userInfo) => {
            setUserInfo(
                userInfo || {
                    id: null,
                    email: null,
                    signinProvider: null,
                    accountEnabled: false,
                    onPaidPlan: false,
                }
            );
        });
    }, [rep]);
    const readingProgress = useSubscribe(rep, rep.subscribe.getReadingProgress(), null);

    const darkModeEnabled = useAutoDarkMode();

    const [showModal, setShowModal] = useState<boolean | null>(null);
    useEffect(() => {
        window.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Tab" || e.key === "Escape") {
                setShowModal(!showModal);
                e.preventDefault();
            }
        };

        if (showModal) {
            reportEvent("openLibraryModal", {
                onNewTab: true,
                onPaidPlan: userInfo?.onPaidPlan,
                trialEnabled: userInfo?.trialEnabled,
                articleCount: readingProgress?.articleCount,
                completedCount: readingProgress?.completedCount,
                annotationCount: readingProgress?.annotationCount,
            });
        } else if (showModal === false) {
            reportEvent("closeLibraryModal");
        }
    }, [showModal]);

    const settings = useSettings(settingsStore);

    if (!userInfo) {
        return <></>;
    }

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep} darkModeEnabled={darkModeEnabled}>
            <LocalScreenshotContext.Provider
                value={
                    !userInfo.accountEnabled
                        ? (articleId) => getLocalScreenshot(articleId, getUnclutterExtensionId())
                        : null
                }
            >
                <ModalContext.Provider
                    value={{ isVisible: showModal, closeModal: () => setShowModal(false) }}
                >
                    <ArticleSection
                        userInfo={userInfo}
                        readingProgress={readingProgress}
                        darkModeEnabled={darkModeEnabled}
                        setShowModal={setShowModal}
                        reportEvent={reportEvent}
                    />
                    <NewTabModal
                        userInfo={userInfo}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                </ModalContext.Provider>
            </LocalScreenshotContext.Provider>
        </ReplicacheContext.Provider>
    );
}

function ArticleSection({
    userInfo,
    readingProgress,
    darkModeEnabled,
    setShowModal,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    readingProgress?: ReadingProgressType;
    darkModeEnabled: boolean;
    setShowModal: (showModal: boolean) => void;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    // @ts-ignore
    const rep = useContext(ReplicacheContext);

    const tabInfos = useTabInfos(0, false, true, null, userInfo);
    const [articleListsCache, setArticleListsCache] = useArticleListsCache(tabInfos);

    return (
        <div className="font-text mb-4 flex flex-col gap-4 text-base">
            <DraggableContext
                articleLists={articleListsCache}
                setArticleLists={setArticleListsCache}
                reportEvent={reportEvent}
            >
                {tabInfos?.map((tabInfo, i) => {
                    return (
                        // TopicGroup
                        <ArticleGroup
                            {...tabInfo}
                            key={tabInfo.key}
                            groupKey={tabInfo.key}
                            articles={articleListsCache?.[tabInfo.key] || []}
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEvent}
                        />
                    );
                })}
            </DraggableContext>
        </div>
    );
}
