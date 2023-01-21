import React, { useEffect, useMemo, useState } from "react";
import {
    DraggableContext,
    useTabInfos,
    useArticleListsCache,
    ArticleGroup,
    getActivityColor,
} from "@unclutter/library-components/dist/components";
import { ModalVisibilityContext } from "@unclutter/library-components/dist/components/Modal/context";
import { LocalScreenshotContext } from "@unclutter/library-components/dist/components/ArticlePreview";
import {
    ReadingProgress as ReadingProgressType,
    ReplicacheContext,
    UserInfo,
    useSubscribe,
} from "@unclutter/library-components/dist/store";
import {
    reportEventContentScript,
    getUnclutterExtensionId,
    getLocalScreenshot,
    useAutoDarkMode,
} from "@unclutter/library-components/dist/common";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
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
        reportEventContentScript(name, { ...data, onNewTab: true }, getUnclutterExtensionId());
    }

    const [userInfo, setUserInfo] = useState<UserInfo>();
    useEffect(() => {
        rep?.query.getUserInfo().then(setUserInfo);
    }, [rep]);
    const readingProgress = useSubscribe(rep, rep.subscribe.getReadingProgress(), null);

    const darkModeEnabled = useAutoDarkMode();

    const [showModal, setShowModal] = useState<boolean | null>(null);
    useEffect(() => {
        window.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Tab") {
                setShowModal(!showModal);
                e.preventDefault();
            }
        };

        if (showModal) {
            reportEvent("openLibraryModal", {
                aiEnabled: userInfo?.aiEnabled,
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
                value={(articleId) => getLocalScreenshot(articleId, getUnclutterExtensionId())}
            >
                <ModalVisibilityContext.Provider
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
                </ModalVisibilityContext.Provider>
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
    const tabInfos = useTabInfos(3 + 4 + 1, false, true, null, userInfo);
    const [articleListsCache, setArticleListsCache] = useArticleListsCache(tabInfos);

    const [showRest, setShowRest] = useState<boolean>(false);
    useEffect(() => {
        const handleScroll = () => {
            if (showRest && window.scrollY === 0) {
                setShowRest(false);
            } else if (!showRest) {
                setShowRest(true);
                reportEvent("expandNewTab");
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [showRest]);

    return (
        <div className="font-text mb-8 flex flex-col gap-4 text-base">
            <DraggableContext
                articleLists={articleListsCache}
                setArticleLists={setArticleListsCache}
                reportEvent={reportEvent}
            >
                <ArticleGroup
                    key="queue"
                    groupKey="queue"
                    title="Reading Queue"
                    icon={
                        <svg className="h-4" viewBox="0 0 640 512">
                            <path
                                fill="currentColor"
                                d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
                            />
                        </svg>
                    }
                    articles={articleListsCache?.["queue"] || []}
                    color={getActivityColor(2, darkModeEnabled)}
                    darkModeEnabled={darkModeEnabled}
                    className="animate-fadein"
                    reportEvent={reportEvent}
                />

                <div
                    className={clsx(
                        "-mt-1 flex select-none justify-center gap-5 text-sm text-gray-400 dark:text-gray-400",
                        showRest ? "hidden" : "animate-fadein"
                    )}
                >
                    <div
                        className="flex cursor-pointer items-center gap-2 p-1 transition-transform hover:scale-[97%]"
                        onClick={() =>
                            window.scrollTo({
                                top: document.body.scrollHeight - window.innerHeight,
                                behavior: "smooth",
                            })
                        }
                    >
                        <svg className="h-4" viewBox="0 0 384 512">
                            <path
                                fill="currentColor"
                                d="M377.4 296.6l-168 176C204.8 477.3 198.6 480 192 480s-12.84-2.688-17.38-7.438l-168-176C-2.5 286.1-2.156 271.8 7.438 262.6c9.5-9.156 24.75-8.812 33.94 .8125L168 396.1V56.02c0-13.25 10.75-24.01 23.1-24.01S216 42.77 216 56.02v340.1l126.6-132.7c9.156-9.625 24.41-9.969 33.94-.8125C386.2 271.8 386.5 286.1 377.4 296.6z"
                            />
                        </svg>
                        Scroll for more
                    </div>
                    <div
                        className="flex cursor-pointer items-center gap-2 p-1 transition-transform hover:scale-95"
                        onClick={() => setShowModal(true)}
                    >
                        <svg className="h-4" viewBox="0 0 576 512">
                            <path
                                fill="currentColor"
                                d="M512 64H64C28.65 64 0 92.65 0 128v256c0 35.35 28.65 64 64 64h448c35.35 0 64-28.65 64-64V128C576 92.65 547.3 64 512 64zM528 384c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16V128c0-8.822 7.178-16 16-16h448c8.822 0 16 7.178 16 16V384zM140 152h-24c-6.656 0-12 5.344-12 12v24c0 6.656 5.344 12 12 12h24c6.656 0 12-5.344 12-12v-24C152 157.3 146.7 152 140 152zM196 200h24c6.656 0 12-5.344 12-12v-24c0-6.656-5.344-12-12-12h-24c-6.656 0-12 5.344-12 12v24C184 194.7 189.3 200 196 200zM276 200h24c6.656 0 12-5.344 12-12v-24c0-6.656-5.344-12-12-12h-24c-6.656 0-12 5.344-12 12v24C264 194.7 269.3 200 276 200zM356 200h24c6.656 0 12-5.344 12-12v-24c0-6.656-5.344-12-12-12h-24c-6.656 0-12 5.344-12 12v24C344 194.7 349.3 200 356 200zM460 152h-24c-6.656 0-12 5.344-12 12v24c0 6.656 5.344 12 12 12h24c6.656 0 12-5.344 12-12v-24C472 157.3 466.7 152 460 152zM140 232h-24c-6.656 0-12 5.344-12 12v24c0 6.656 5.344 12 12 12h24c6.656 0 12-5.344 12-12v-24C152 237.3 146.7 232 140 232zM196 280h24c6.656 0 12-5.344 12-12v-24c0-6.656-5.344-12-12-12h-24c-6.656 0-12 5.344-12 12v24C184 274.7 189.3 280 196 280zM276 280h24c6.656 0 12-5.344 12-12v-24c0-6.656-5.344-12-12-12h-24c-6.656 0-12 5.344-12 12v24C264 274.7 269.3 280 276 280zM356 280h24c6.656 0 12-5.344 12-12v-24c0-6.656-5.344-12-12-12h-24c-6.656 0-12 5.344-12 12v24C344 274.7 349.3 280 356 280zM460 232h-24c-6.656 0-12 5.344-12 12v24c0 6.656 5.344 12 12 12h24c6.656 0 12-5.344 12-12v-24C472 237.3 466.7 232 460 232zM400 320h-224C167.1 320 160 327.1 160 336V352c0 8.875 7.125 16 16 16h224c8.875 0 16-7.125 16-16v-16C416 327.1 408.9 320 400 320z"
                            />
                        </svg>
                        TAB to open Library
                    </div>
                </div>

                {tabInfos?.slice(1).map((tabInfo, i) => {
                    return (
                        // TopicGroup
                        <ArticleGroup
                            {...tabInfo}
                            key={tabInfo.key}
                            groupKey={tabInfo.key}
                            articles={articleListsCache?.[tabInfo.key] || []}
                            darkModeEnabled={darkModeEnabled}
                            className={clsx(showRest ? "animate-slidein" : "opacity-0")}
                            // style={{ animationDelay: `${i * 50}ms` }}
                            reportEvent={reportEvent}
                        />
                    );
                })}
            </DraggableContext>
        </div>
    );
}
