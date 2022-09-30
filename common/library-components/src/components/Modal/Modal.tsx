import React from "react";
import { ReplicacheContext } from "../../store";
import { getRandomColor, getWeekStart } from "../../common";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";
import RecentModalTab from "./Recent";

import StatsModalTab from "./Stats";
import ProgressSteps from "../Charts/ProgressSteps";
import Sidebar from "./Sidebar";
import { LindyIcon } from "../Icons";
import GraphModalTab, { CustomGraphData } from "./Graph";

export function LibraryModalPage({
    darkModeEnabled = false,
    articleUrl,
    graph,
    new_link_count,
    isVisible = true,
    closeModal = () => {},
}: {
    darkModeEnabled?: boolean;
    articleUrl?: string;
    graph?: CustomGraphData;
    new_link_count?: number;
    isVisible?: boolean;
    closeModal?: () => void;
}) {
    const rep = useContext(ReplicacheContext);
    const [articleCount, setArticleCount] = useState<number | null>(null);
    useEffect(() => {
        rep?.query.getArticlesCount().then(setArticleCount);
    }, [rep]);

    const [currentTab, setCurrentTab] = useState("recent");

    return (
        <div
            className={clsx(
                "modal fixed top-0 left-0 h-screen w-screen pt-5 text-base text-stone-800 dark:text-[rgb(232,230,227)]",
                isVisible ? "modal-visible" : "modal-hidden",
                darkModeEnabled && "dark"
            )}
        >
            <div
                className="modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out bg-stone-800 opacity-50 dark:bg-[rgb(19,21,22)]"
                onClick={closeModal}
            />
            <div className="modal-content relative z-10 mx-auto flex h-5/6 max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow dark:bg-[#212121]">
                <ModalHeader
                    articleCount={articleCount}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                />
                <ModalContent
                    articleCount={articleCount}
                    articleUrl={articleUrl}
                    darkModeEnabled={darkModeEnabled}
                    graph={graph}
                    new_link_count={new_link_count}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                />
            </div>
        </div>
    );
}

function ModalHeader({
    articleCount,
    currentTab,
    setCurrentTab,
}: {
    articleCount: number | null;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
}) {
    const rep = useContext(ReplicacheContext);
    const [weekArticleCount, setWeekArticleCount] = useState<number | null>(
        null
    );
    useEffect(() => {
        if (!rep) {
            return;
        }

        rep.query
            .listRecentArticles(getWeekStart().getTime())
            .then((articles) => setWeekArticleCount(articles.length));
    }, [rep]);

    return (
        <div className="flex w-full gap-4 rounded-t-lg py-3 px-4">
            <div
                className="flex w-32 cursor-pointer items-center gap-2 transition-all hover:scale-[97%]"
                onClick={() => setCurrentTab("stats")}
            >
                <LindyIcon className="w-8" />
                <span className="font-title text-2xl font-bold">Library</span>
            </div>
            <div className="flex-grow">
                <input
                    className="font-text w-full max-w-sm rounded-md bg-stone-100 px-3 py-1.5 font-medium leading-none placeholder-stone-300 outline-none dark:bg-neutral-800 dark:placeholder-neutral-600"
                    spellCheck="false"
                    autoFocus
                    placeholder={`Search across ${articleCount} articles...`}
                />
            </div>

            <ProgressSteps
                current={weekArticleCount || 0}
                target={6}
                // isSelected={currentTab === "stats"}
                onClick={() => setCurrentTab("stats")}
            />
            {/* <div className="h-0">
                <ProgressCircle id="1" current={1} />
            </div> */}
        </div>
    );
}

function ModalContent({
    articleUrl,
    articleCount,
    darkModeEnabled,
    graph,
    new_link_count,
    currentTab,
    setCurrentTab,
}: {
    articleUrl?: string;
    articleCount: number | null;
    darkModeEnabled: boolean;
    graph?: CustomGraphData;
    new_link_count?: number;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
}) {
    return (
        <div className="font-text relative flex h-full gap-3 overflow-hidden text-base">
            <aside className="absolute mx-4 h-full w-32 pt-1">
                <Sidebar
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                    new_link_count={new_link_count}
                />
            </aside>
            <div className="ml-32 max-h-full w-full overflow-auto p-4 pl-8 pt-1">
                {currentTab === "recent" && <RecentModalTab />}
                {currentTab === "graph" && (
                    <GraphModalTab
                        graph={graph}
                        darkModeEnabled={darkModeEnabled}
                    />
                )}
                {currentTab === "stats" && (
                    <StatsModalTab
                        articleCount={articleCount}
                        darkModeEnabled={darkModeEnabled}
                    />
                )}
            </div>
        </div>
    );
}
