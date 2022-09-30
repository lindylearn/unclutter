import React, { ReactNode } from "react";
import { useContext, useEffect, useState } from "react";

import { ReplicacheContext } from "../../store";
import { getWeekStart } from "../../common";
import ProgressSteps from "../Charts/ProgressSteps";
import { LindyIcon } from "../Icons";
import { InlineProgressCircle } from "../Charts";
import clsx from "clsx";

export default function HeaderBar({
    articleCount,
    currentTab,
    setCurrentTab,
}: {
    articleCount?: number;
    currentTab: string;
    setCurrentTab: (tab: string) => void;
}) {
    return (
        <div className="header-bar mb-4 flex w-full gap-4 rounded-t-lg">
            <div className="flex-grow">
                <input
                    className="font-text w-full max-w-md rounded-md bg-stone-100 px-3 py-1.5 font-medium leading-none placeholder-stone-300 outline-none dark:bg-neutral-800 dark:placeholder-neutral-600"
                    spellCheck="false"
                    autoFocus
                    placeholder={`Search across ${articleCount} articles...`}
                />
            </div>

            <StatsHeader />

            {/* <ProgressSteps
                current={weekArticleCount || 0}
                target={6}
                // isSelected={currentTab === "stats"}
                onClick={() => setCurrentTab("stats")}
            /> */}

            {/* <InlineProgressCircle
                    current={weekArticleCount}
                    target={10}
                    className="w-8"
                /> */}
        </div>
    );
}

function StatsHeader({}) {
    const rep = useContext(ReplicacheContext);
    const [weekArticleCount, setWeekArticleCount] = useState<number>();
    useEffect(() => {
        if (!rep) {
            return;
        }

        rep.query
            .listRecentArticles(getWeekStart().getTime())
            .then((articles) => setWeekArticleCount(articles.length));
    }, [rep]);

    return (
        <div className="flex cursor-pointer gap-4 rounded-md px-2 transition-all hover:scale-x-[99%] hover:scale-y-[97%] hover:bg-stone-100 dark:hover:bg-neutral-800">
            <ResourceStat
                value={weekArticleCount}
                icon={
                    <svg className="h-5" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                        />
                    </svg>
                }
            />
            {/* <ResourceStat
                value={weekArticleCount + 2}
                icon={
                    <svg className="h-4" viewBox="0 0 640 512">
                        <path
                            fill="currentColor"
                            d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
                        />
                    </svg>
                }
            /> */}
            <ResourceStat
                value={0}
                icon={
                    <svg className="h-5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                        />
                    </svg>
                }
            />
        </div>
    );
}

function ResourceStat({ value, icon }: { value?: number; icon: ReactNode }) {
    return (
        <div
            className={clsx(
                "flex items-center gap-1.5 transition-opacity",
                value === undefined && "opacity-0"
            )}
        >
            {icon}
            <div className="font-title text-2xl font-bold">{value || 0}</div>
        </div>
    );
}
