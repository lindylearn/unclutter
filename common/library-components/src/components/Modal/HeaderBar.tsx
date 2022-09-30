import React from "react";
import { useContext, useEffect, useState } from "react";

import { ReplicacheContext } from "../../store";
import { getWeekStart } from "../../common";
import ProgressSteps from "../Charts/ProgressSteps";
import { LindyIcon } from "../Icons";

export default function HeaderBar({
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
        <div className="header-bar mt-4 mb-4 flex w-full gap-4 rounded-t-lg">
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
