import React from "react";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";

import StatsModalTab from "./Stats";
import Sidebar from "./Sidebar";
import GraphModalTab, { CustomGraphData } from "./Graph";
import HeaderBar from "./HeaderBar";
import { ReplicacheContext } from "../../store";
import RecentModalTab from "./Recent";
import { LindyIcon } from "../Icons";

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
        <div className="font-text flex h-full overflow-hidden text-base">
            <aside className="left-side p-4">
                <div className="h-full w-32">
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
                        currentTab={currentTab}
                        setCurrentTab={setCurrentTab}
                        new_link_count={new_link_count}
                    />
                </div>
            </aside>
            <div className="right-side flex max-h-full w-full flex-col overflow-auto p-4">
                <HeaderBar
                    articleCount={articleCount}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                />

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
