import React, { createContext, useRef } from "react";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";

import StatsModalTab from "./Stats";
import Sidebar from "./Sidebar";
import { GraphPage } from "./Graph/GraphPage";
import { CustomGraphData } from "./Graph/data";
import { FeedSubscription, ReplicacheContext, Topic, UserInfo } from "../../store";
import RecentModalTab from "./Recent";
import { LindyIcon } from "../Icons";
import HighlightsTab from "./Highlights";
import FeedsModalTab from "./Feeds";
import UpgradeModalTab from "./Upgrade";
import SettingsModalTab from "./Settings";

export const ModalContext = createContext<{
    isVisible: boolean;
    closeModal?: () => void;
}>({
    isVisible: false,
    closeModal: () => {},
});
export const FilterContext = createContext<{
    currentArticle?: string;
    currentTopic?: Topic;
    changedTopic?: boolean;
    domainFilter?: string;
    currentSubscription?: FeedSubscription;
    showTopic: (topicId: string) => void;
    showDomain: (domain: string) => void;
    setDomainFilter: (domain?: string) => void;
    relatedLinkCount?: number;
    currentAnnotationsCount?: number;
}>({
    showTopic: () => {},
    showDomain: () => {},
    setDomainFilter: () => {},
});

export function LibraryModalPage({
    userInfo,
    darkModeEnabled = false,
    showSignup = false,
    currentArticle,
    currentSubscription,
    initialTopic,
    graph,
    relatedLinkCount,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    darkModeEnabled?: boolean;
    showSignup?: boolean;
    currentArticle?: string;
    currentSubscription?: FeedSubscription;
    initialTopic?: Topic;
    graph?: CustomGraphData;
    relatedLinkCount?: number;
    closeModal?: () => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const { isVisible, closeModal } = useContext(ModalContext);

    const rep = useContext(ReplicacheContext);
    const [articleCount, setArticleCount] = useState<number>();
    const [currentAnnotationsCount, setCurrentAnnotationsCount] = useState<number>();
    useEffect(() => {
        rep?.query.getArticlesCount().then(setArticleCount);
        if (currentArticle) {
            rep?.query.listArticleAnnotations(currentArticle).then((annotations) => {
                setCurrentAnnotationsCount(annotations.length);
                if (annotations.length > 0) {
                    setCurrentTab("highlights");
                }
            });
        }
    }, [rep]);

    const initialRender = useRef<boolean>(true);
    const [currentTab, setCurrentTab] = useState(
        relatedLinkCount && (userInfo.onPaidPlan || userInfo.trialEnabled) ? "graph" : "feeds"
    );
    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
        } else {
            reportEvent("changeModalTab", { tab: currentTab });
        }
    }, [currentTab]);

    const [currentTopic, setCurrentTopic] = useState<Topic | undefined>(initialTopic);
    const [domainFilter, setDomainFilter] = useState<string>();
    useEffect(() => {
        setCurrentTopic(initialTopic);
    }, [initialTopic]);
    async function showTopic(topicId: string) {
        const topic = await rep?.query.getTopic(topicId);
        setCurrentTopic(topic);
        setCurrentTab("graph");
        reportEvent("showTopicGraph");
    }
    function showDomain(domain: string) {
        setDomainFilter(domain);
        setCurrentTab("list");
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
                        currentTopic,
                        changedTopic: currentTopic !== initialTopic?.id,
                        domainFilter,
                        setDomainFilter,
                        showTopic,
                        showDomain,
                        relatedLinkCount,
                        currentAnnotationsCount,
                    }}
                >
                    <ModalContent
                        userInfo={userInfo}
                        articleCount={articleCount}
                        darkModeEnabled={darkModeEnabled}
                        showSignup={showSignup}
                        graph={graph}
                        currentTab={currentTab}
                        setCurrentTab={setCurrentTab}
                        reportEvent={reportEvent}
                    />
                </FilterContext.Provider>
            </div>
        </div>
    );
}

function ModalContent({
    userInfo,
    articleCount,
    showSignup,
    darkModeEnabled,
    graph,
    currentTab,
    setCurrentTab,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    articleCount?: number;
    darkModeEnabled: boolean;
    showSignup: boolean;
    graph?: CustomGraphData;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const { currentArticle, currentAnnotationsCount } = useContext(FilterContext);
    if (currentArticle && currentAnnotationsCount === undefined) {
        return <></>;
    }

    return (
        <div className="font-text flex h-full items-stretch overflow-hidden text-base">
            <aside className="left-side p-4">
                <div className="flex h-full w-32 flex-col">
                    <div
                        className="mb-4 flex w-full cursor-pointer items-center gap-1.5 transition-all hover:scale-[97%]"
                        onClick={() => setCurrentTab("stats")}
                    >
                        <LindyIcon className="w-8" />
                        <span className="font-title text-2xl font-bold">Library</span>
                    </div>

                    <Sidebar
                        userInfo={userInfo}
                        currentTab={currentTab}
                        setCurrentTab={setCurrentTab}
                        darkModeEnabled={darkModeEnabled}
                        showSignup={showSignup}
                    />
                </div>
            </aside>
            <div
                className={clsx(
                    "right-side flex h-full max-h-full w-full flex-col",
                    currentTab === "stats" ? "overflow-y-scroll" : "overflow-y-auto",
                    currentTab === "graph" ? "" : "p-4"
                )}
            >
                {currentTab === "list" && (
                    <RecentModalTab
                        userInfo={userInfo}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                )}
                {currentTab === "graph" && (
                    <GraphPage
                        graph={graph}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                )}
                {currentTab === "stats" && (
                    <StatsModalTab
                        userInfo={userInfo}
                        articleCount={articleCount}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                )}
                {currentTab === "highlights" && (
                    <HighlightsTab
                        userInfo={userInfo}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                )}
                {currentTab === "feeds" && <FeedsModalTab darkModeEnabled={darkModeEnabled} />}
                {currentTab === "signup" && (
                    <UpgradeModalTab darkModeEnabled={darkModeEnabled} reportEvent={reportEvent} />
                )}
                {currentTab === "settings" && (
                    <SettingsModalTab
                        userInfo={userInfo}
                        darkModeEnabled={darkModeEnabled}
                        showSignup={showSignup}
                        reportEvent={reportEvent}
                    />
                )}
            </div>
        </div>
    );
}
