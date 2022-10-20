import React, { useState } from "react";
import { ForceGraphInstance } from "force-graph";

import { getDomain, getRandomLightColor, openArticleResilient } from "../../../common";
import { CustomGraphNode } from "./data";
import { readingProgressFullClamp, Topic } from "../../../store";
import { ResourceStat } from "../numbers";

export function NodeTooltip({
    x,
    y,
    title,
    url,
    depth,
    reading_progress,
    isCompleted,
    isCompletedAdjacent,
    word_count,
    forceGraph,
    currentTopic,
    darkModeEnabled,
    reportEvent = () => {},
}: CustomGraphNode & {
    forceGraph: ForceGraphInstance;
    currentTopic?: Topic;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, data?: any) => void;
}) {
    const coords = forceGraph.graph2ScreenCoords(x!, y!);

    let readingProgress = reading_progress;
    if (readingProgress > readingProgressFullClamp) {
        readingProgress = 1;
    }

    const domain = getDomain(url);

    function onClick() {
        openArticleResilient(url);
        reportEvent("clickGraphArticle", {
            depth: depth,
            isCompleted: isCompleted,
            isCompletedAdjacent: isCompletedAdjacent,
        });
    }

    return (
        <div>
            <div
                className="cursor-padding absolute cursor-pointer"
                style={{
                    left: coords.x - 40 / 2,
                    top: coords.y,
                    width: 40,
                    height: 12,
                }}
            />
            <div
                className="node-tooltip animate-bouncein absolute w-60 cursor-pointer overflow-hidden rounded-md bg-white px-3 py-2 text-sm shadow transition-transform hover:scale-[98%] dark:bg-[#212121]"
                style={{ left: coords.x - 240 / 2, top: coords.y + 12 }}
                onClick={onClick}
            >
                <div className="flex">
                    <div className="font-title font-bold">{title || url}</div>
                    {/* <div className="flex flex-col items-center rounded-md bg-stone-50 p-2 font-medium transition-transform hover:scale-[95%]">
                        <svg className="h-4" viewBox="0 0 640 512">
                            <path
                                fill="currentColor"
                                d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
                            />
                        </svg>
                        Queue
                    </div> */}
                </div>
                <div className="mt-0.5 mb-1 flex justify-between">
                    <div className="text-neutral-500 dark:text-stone-400">{domain}</div>
                    {readingProgress !== 1 && word_count >= 200 && domain.length < 19 && (
                        <div className="text-neutral-500 dark:text-stone-400">
                            {Math.round((word_count / 200) * (1 - readingProgress))} min left
                        </div>
                    )}

                    {/* {readingProgress === 1 && (
                    <ResourceStat type="highlights" value={2} />
                )} */}
                </div>

                <div
                    className="progress bg-lindy dark:bg-lindyDark absolute bottom-0 left-0 h-[7px] w-full rounded-r transition-all"
                    style={{
                        // @ts-ignore
                        "--progress": `${Math.max(reading_progress, 0.05) * 100}%`,
                        background:
                            currentTopic && getRandomLightColor(currentTopic.id, darkModeEnabled),
                    }}
                />
            </div>

            {/* <ArticleDropdownMenu
                article={article}
                open={dropdownOpen}
                setOpen={setDropdownOpen}
                reportEvent={reportEvent}
                small={small}
            /> */}
        </div>
    );
}
