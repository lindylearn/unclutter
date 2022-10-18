import React from "react";
import { ForceGraphInstance } from "force-graph";

import {
    getDomain,
    getRandomLightColor,
    openArticleResilient,
} from "../../../common";
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
        <div
            className="node-tooltip animate-bouncein absolute w-60 cursor-pointer overflow-hidden rounded-md bg-white px-3 py-2 text-sm shadow transition-transform hover:scale-[98%] dark:bg-[#212121]"
            style={{ left: coords.x - 240 / 2, top: coords.y + 12 }}
            onClick={onClick}
        >
            <div className="font-title font-bold">{title || url}</div>
            <div className="mt-0.5 mb-1 flex justify-between">
                <div className="text-neutral-500 dark:text-stone-400">
                    {domain}
                </div>
                {readingProgress !== 1 &&
                    word_count >= 200 &&
                    domain.length < 19 && (
                        <div className="text-neutral-500 dark:text-stone-400">
                            {Math.round(
                                (word_count / 200) * (1 - readingProgress)
                            )}{" "}
                            min left
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
                        currentTopic &&
                        getRandomLightColor(currentTopic.id, darkModeEnabled),
                }}
            />
        </div>
    );
}
