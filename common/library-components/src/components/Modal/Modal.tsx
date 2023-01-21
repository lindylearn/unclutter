import React, { useRef } from "react";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";

import StatsModalTab from "./Stats";
import Sidebar from "./Sidebar";
import { FeedSubscription, ReplicacheContext, Topic, UserInfo } from "../../store";
import RecentModalTab from "./Recent";
import { LindyIcon } from "../Icons";
import HighlightsTab from "./Highlights";
import SettingsModalTab from "./Settings";
import { ModalVisibilityContext, FilterContext, ModalStateContext } from "./context";

export function LibraryModalPage({
    userInfo,
    darkModeEnabled = false,
    showSignup = false,
    currentArticle,
    initialSubscription,
    initialTopic,
    initialTab,
    relatedLinkCount,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    darkModeEnabled?: boolean;
    showSignup?: boolean;
    currentArticle?: string;
    initialSubscription?: FeedSubscription;
    initialTopic?: Topic;
    initialTab?: string;
    relatedLinkCount?: number;
    closeModal?: () => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const { isVisible, closeModal } = useContext(ModalVisibilityContext);

    const rep = useContext(ReplicacheContext);
    const [articleCount, setArticleCount] = useState<number>();
    const [currentAnnotationsCount, setCurrentAnnotationsCount] = useState<number>();
    useEffect(() => {
        rep?.query.getArticlesCount().then(setArticleCount);
        if (currentArticle) {
            rep?.query.listArticleAnnotations(currentArticle).then((annotations) => {
                setCurrentAnnotationsCount(annotations.length);
                // if (annotations.length > 0) {
                //     setCurrentTab("highlights");
                // }
            });
        }
    }, [rep]);

    const initialRender = useRef<boolean>(true);
    const [currentTab, setCurrentTab] = useState(initialTab || "list");
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
        } else {
            reportEvent("changeModalTab", { tab: currentTab });
        }

        if (currentTab !== "highlights") {
            setDomainFilter(undefined);
        }
    }, [currentTab]);

    const [currentSubscription, setCurrentSubscription] = useState<FeedSubscription | undefined>(
        initialSubscription
    );
    const [domainFilter, setDomainFilter] = useState<string>();

    async function showDomain(domain: string) {
        // const subscriptions = await rep?.query.listSubscriptions();
        // const domainSubscription = subscriptions?.find((s) => s.domain === domain);
        // if (domainSubscription) {
        //     setCurrentSubscription(domainSubscription);
        //     setCurrentTab("feeds");
        //     reportEvent("showDomainFeed");
        // }

        setDomainFilter(domain);
        setCurrentTab("highlights");

        reportEvent("showDomainDetails");
    }

    return (
        <div
            className={clsx(
                "modal fixed top-0 left-0 h-screen w-screen text-base",
                isVisible && "modal-visible",
                isVisible === false && "modal-hidden",
                darkModeEnabled && "dark"
            )}
            style={
                darkModeEnabled
                    ? {
                          colorScheme: "dark",
                      }
                    : {}
            }
        >
            <div
                className="modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out bg-stone-800 opacity-50 dark:bg-[rgb(19,21,22)]"
                onClick={closeModal}
            />
            <div className="modal-content relative z-10 mx-auto mt-10 flex h-5/6 max-h-[700px] max-w-5xl flex-col overflow-hidden rounded-lg bg-white text-stone-800 shadow dark:bg-[#212121] dark:text-[rgb(232,230,227)]">
                <FilterContext.Provider
                    value={{
                        currentArticle,
                        currentSubscription,
                        domainFilter,
                        setDomainFilter,
                        showDomain,
                        setCurrentSubscription,
                        relatedLinkCount,
                        currentAnnotationsCount,
                    }}
                >
                    <ModalStateContext.Provider
                        value={{ darkModeEnabled, showSignup, userInfo, reportEvent }}
                    >
                        <ModalContent
                            articleCount={articleCount}
                            currentTab={currentTab}
                            setCurrentTab={setCurrentTab}
                        />
                    </ModalStateContext.Provider>
                </FilterContext.Provider>
            </div>
        </div>
    );
}

function ModalContent({
    articleCount,
    currentTab,
    setCurrentTab,
}: {
    articleCount?: number;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
}) {
    return (
        <div className="font-text flex h-full items-stretch overflow-hidden text-base">
            <aside className="left-side p-4">
                <div className="flex h-full w-32 flex-col">
                    <div className="mb-4 flex w-full items-center gap-2">
                        <LindyIcon className="w-8" />

                        <h1
                            className="font-title select-none text-2xl font-bold"
                            // bg-gradient-to-b from-yellow-300 to-amber-400 bg-clip-text text-transparent
                            // style={{ WebkitBackgroundClip: "text" }}
                        >
                            Library
                        </h1>
                    </div>

                    <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
                </div>
            </aside>
            <div
                className={clsx(
                    "right-side flex h-full max-h-full w-full flex-col",
                    currentTab === "stats" ? "overflow-y-scroll" : "overflow-y-auto",
                    currentTab === "graph" ? "" : "p-4"
                )}
            >
                {currentTab === "list" && <RecentModalTab />}
                {currentTab === "stats" && <StatsModalTab articleCount={articleCount} />}
                {currentTab === "highlights" && <HighlightsTab />}
                {/* {currentTab === "feeds" &&
                    (currentSubscription ? (
                        <FeedsDetailsTab
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEvent}
                        />
                    ) : (
                        <FeedListTab darkModeEnabled={darkModeEnabled} reportEvent={reportEvent} />
                    ))} */}
                {/* {currentTab === "signup" && (
                    <UpgradeModalTab darkModeEnabled={darkModeEnabled} reportEvent={reportEvent} />
                )} */}
                {/* {currentTab === "sync" && <SyncModalTab />} */}
                {currentTab === "settings" && <SettingsModalTab />}
            </div>
        </div>
    );
}
