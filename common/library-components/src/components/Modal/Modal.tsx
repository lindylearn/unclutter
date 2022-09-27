import React from "react";
import {
    getArticlesCount,
    listRecentArticles,
    ReplicacheContext,
} from "../../store";
import { getRandomColor } from "../../common";
import clsx from "clsx";
import { useContext, useEffect, useState } from "react";
import { useSubscribe } from "replicache-react";
import RecentModalTab from "./Recent";

import StatsModalTab from "./Stats";
import ProgressSteps from "../Charts/ProgressSteps";
import Sidebar from "./Sidebar";
import { LindyIcon } from "../Icons";
import GraphModalTab from "./Graph";

export function LibraryModalPage({
    darkModeEnabled = false,
    articleUrl = undefined,
}: {
    darkModeEnabled?: boolean;
    articleUrl?: string;
}) {
    const rep = useContext(ReplicacheContext);
    const [articleCount, setArticleCount] = useState<number | null>(null);
    useEffect(() => {
        if (!rep) {
            return;
        }
        rep.query(getArticlesCount).then(setArticleCount);
    }, [rep]);

    const [currentTab, setCurrentTab] = useState("stats");

    darkModeEnabled = false;
    articleUrl =
        "https://www.gamesindustry.biz/ubisoft-staff-call-for-more-change-explanations-around-harassment-culture";

    return (
        <div className="modal relative h-screen w-screen pt-5 text-stone-800 dark:text-[rgb(232,230,227)]">
            <div
                className={clsx(
                    "modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out",
                    darkModeEnabled
                        ? "bg-[rgb(19,21,22)] opacity-50"
                        : "bg-stone-800 opacity-50"
                )}
            />
            <div className="modal-content relative z-10 mx-auto flex h-5/6 max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow dark:bg-[#212121]">
                <ModalHeader
                    articleCount={articleCount}
                    darkModeEnabled={darkModeEnabled}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                />
                <ModalContent
                    articleUrl={articleUrl}
                    darkModeEnabled={darkModeEnabled}
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                />
            </div>
        </div>
    );
}

function ModalHeader({
    articleCount,
    darkModeEnabled,
    currentTab,
    setCurrentTab,
}) {
    const rep = useContext(ReplicacheContext);
    const [weekArticleCount, setWeekArticleCount] = useState<number | null>(
        null
    );
    useEffect(() => {
        if (!rep) {
            return;
        }
        const start = new Date();
        const diff =
            start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1);
        start.setDate(diff);

        rep.query((tx) => listRecentArticles(tx, start)).then((articles) =>
            setWeekArticleCount(articles.length)
        );
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
                darkModeEnabled={darkModeEnabled}
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
    darkModeEnabled,
    currentTab,
    setCurrentTab,
}) {
    return (
        <div className="font-text relative flex h-full gap-3 overflow-hidden px-4 pb-4 text-base">
            <aside className="absolute h-full w-32 pt-1 pb-3">
                <Sidebar
                    currentTab={currentTab}
                    setCurrentTab={setCurrentTab}
                />
            </aside>
            <div className="ml-32 max-h-full w-full overflow-auto pl-4 pt-1">
                {currentTab === "recent" && <RecentModalTab />}
                {/* {currentTab === "graph" && (
                    <GraphModalTab
                        articleUrl={articleUrl}
                        darkModeEnabled={darkModeEnabled}
                    />
                )} */}
                {currentTab === "stats" && (
                    <StatsModalTab darkModeEnabled={darkModeEnabled} />
                )}
            </div>
        </div>
    );
}
