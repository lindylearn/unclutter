import React from "react";
import { ForceGraphInstance } from "force-graph";

import { getDomain, openArticle } from "../../../common";
import { ResourceStat } from "../Stats";
import { CustomGraphNode } from "./data";
import { readingProgressFullClamp } from "../../../store";

export function NodeTooltip({
    x,
    y,
    title,
    url,
    reading_progress,
    word_count,
    forceGraph,
}: CustomGraphNode & { forceGraph: ForceGraphInstance }) {
    const coords = forceGraph.graph2ScreenCoords(x!, y!);

    let readingProgress = reading_progress;
    if (readingProgress > readingProgressFullClamp) {
        readingProgress = 1;
    }

    const domain = getDomain(url);

    return (
        <div
            className="node-tooltip animate-bouncein absolute w-60 cursor-pointer overflow-hidden rounded-md bg-white px-3 py-2 text-sm shadow transition-transform hover:scale-[98%] dark:bg-[#212121]"
            style={{ left: coords.x - 240 / 2, top: coords.y + 12 }}
            onClick={() => openArticle(url)}
        >
            <div className="font-title font-bold">{title}</div>
            <div className="mt-0.5 mb-1 flex justify-between">
                <div className="text-stone-500 dark:text-stone-400">
                    {domain}
                </div>
                {readingProgress !== 1 &&
                    word_count >= 200 &&
                    domain.length < 20 && (
                        <div className="text-stone-500 dark:text-stone-400">
                            {Math.round(
                                (word_count / 200) * (1 - readingProgress)
                            )}{" "}
                            min left
                        </div>
                    )}

                {readingProgress === 1 && (
                    <ResourceStat type="highlights" value={2} />
                )}
            </div>

            <div
                className="progress bg-lindy dark:bg-lindyDark absolute bottom-0 left-0 h-[7px] w-full rounded-r transition-all"
                style={{
                    // @ts-ignore
                    "--progress": `${Math.max(reading_progress, 0.05) * 100}%`,
                }}
            />
        </div>
    );
}
