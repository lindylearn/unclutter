import React from "react";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";

import StatsModalTab from "./Stats";
import Sidebar from "./Sidebar";
import { GraphPage } from "./Graph/GraphPage";
import { CustomGraphData } from "./Graph/data";
import HeaderBar from "./HeaderBar";
import { ReplicacheContext, Topic } from "../../store";
import RecentModalTab from "./Recent";
import { LindyIcon } from "../Icons";
import HighlightsTab from "./Highlights";
import { UserInfo } from "../../store/user";
import UpgradeModalTab from "./Upgrade";
import SettingsModalTab from "./Settings";

export function LibraryModalPage({
    userInfo,
    darkModeEnabled = false,
    currentArticle,
    initialTopic,
    graph,
    relatedLinkCount,
    isVisible,
    closeModal = () => {},
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    darkModeEnabled?: boolean;
    currentArticle?: string;
    initialTopic?: Topic;
    graph?: CustomGraphData;
    relatedLinkCount?: number;
    isVisible: boolean | null;
    closeModal?: () => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const rep = useContext(ReplicacheContext);
    const [articleCount, setArticleCount] = useState<number>();
    useEffect(() => {
        rep?.query.getArticlesCount().then(setArticleCount);
    }, [rep]);

    const [currentTab, setCurrentTab] = useState(
        userInfo.topicsEnabled ? "graph" : "stats"
    );
    useEffect(() => {
        reportEvent("changeModalTab", { tab: currentTab });
    }, [currentTab]);

    const [currentTopic, setCurrentTopic] = useState<Topic | undefined>(
        initialTopic
    );
    const [domainFilter, setDomainFilter] = useState<string | null>(null);
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
                <ModalContent
                    userInfo={userInfo}
                    articleCount={articleCount}
                    currentArticle={currentArticle}
                    currentTopic={currentTopic}
                    changedTopic={currentTopic !== initialTopic?.id}
                    domainFilter={domainFilter}
                    setDomainFilter={setDomainFilter}
                    darkModeEnabled={darkModeEnabled}
                    graph={graph}
                    relatedLinkCount={relatedLinkCount}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                    showTopic={showTopic}
                    showDomain={showDomain}
                    reportEvent={reportEvent}
                />
            </div>
        </div>
    );
}

function ModalContent({
    userInfo,
    currentArticle,
    currentTopic,
    changedTopic,
    domainFilter,
    setDomainFilter,
    articleCount,
    darkModeEnabled,
    graph,
    relatedLinkCount,
    currentTab,
    setCurrentTab,
    showTopic,
    showDomain,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    currentArticle?: string;
    currentTopic?: Topic;
    changedTopic: boolean;
    domainFilter: string | null;
    setDomainFilter: (domain: string | null) => void;
    articleCount?: number;
    darkModeEnabled: boolean;
    graph?: CustomGraphData;
    relatedLinkCount?: number;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
    showTopic: (topicId: string) => void;
    showDomain: (domain: string) => void;
    reportEvent?: (event: string, data?: any) => void;
}) {
    return (
        <div className="font-text flex h-full overflow-hidden text-base">
            <aside className="left-side p-4">
                <div className="flex h-full w-32 flex-col">
                    <div
                        className="mb-4 flex w-full cursor-pointer items-center gap-1.5 transition-all hover:scale-[97%]"
                        onClick={() => setCurrentTab("stats")}
                    >
                        <LindyIcon className="w-8" />
                        <span className="font-title text-2xl font-bold">
                            Library
                        </span>
                    </div>

                    <Sidebar
                        userInfo={userInfo}
                        currentTab={currentTab}
                        currentTopic={currentTopic}
                        changedTopic={changedTopic}
                        setCurrentTab={setCurrentTab}
                        relatedLinkCount={relatedLinkCount}
                        darkModeEnabled={darkModeEnabled}
                    />
                </div>
            </aside>
            <div
                className={clsx(
                    "right-side flex max-h-full w-full flex-col",
                    currentTab === "stats"
                        ? "overflow-y-scroll"
                        : "overflow-y-auto",
                    currentTab === "graph" ? "" : "p-4"
                )}
            >
                {/* <HeaderBar
                    articleCount={articleCount}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                /> */}

                {currentTab === "list" && (
                    <RecentModalTab
                        userInfo={userInfo}
                        currentTopic={currentTopic}
                        domainFilter={domainFilter}
                        setDomainFilter={setDomainFilter}
                        darkModeEnabled={darkModeEnabled}
                        showTopic={showTopic}
                    />
                )}
                {currentTab === "graph" &&
                    (userInfo.topicsEnabled ? (
                        <GraphPage
                            graph={graph}
                            darkModeEnabled={darkModeEnabled}
                            currentArticle={currentArticle}
                            currentTopic={currentTopic}
                            changedTopic={changedTopic}
                            reportEvent={reportEvent}
                        />
                    ) : (
                        <UpgradeModalTab darkModeEnabled={darkModeEnabled} />
                    ))}
                {currentTab === "stats" && (
                    <StatsModalTab
                        userInfo={userInfo}
                        articleCount={articleCount}
                        darkModeEnabled={darkModeEnabled}
                        showTopic={showTopic}
                        showDomain={showDomain}
                        reportEvent={reportEvent}
                    />
                )}
                {currentTab === "highlights" && <HighlightsTab />}
                {currentTab === "settings" && (
                    <SettingsModalTab
                        userInfo={userInfo}
                        currentArticle={currentArticle}
                        darkModeEnabled={darkModeEnabled}
                    />
                )}
            </div>
        </div>
    );
}
