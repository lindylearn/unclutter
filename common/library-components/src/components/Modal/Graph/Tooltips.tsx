import React from "react";
import { ForceGraphInstance } from "force-graph";

import { getDomain, openArticle } from "../../../common";
import { ResourceStat } from "../Stats";
import { CustomGraphNode } from "./data";

export function NodeTooltip({
    x,
    y,
    title,
    url,
    reading_progress,
    forceGraph,
}: CustomGraphNode & { forceGraph: ForceGraphInstance }) {
    const coords = forceGraph.graph2ScreenCoords(x!, y!);

    return (
        <div
            className="node-tooltip absolute w-60 cursor-pointer overflow-hidden rounded-md bg-white p-3 text-sm shadow transition-transform hover:scale-[98%]"
            style={{ left: coords.x - 240 / 2, top: coords.y + 10 }}
            onClick={() => openArticle(url)}
        >
            <div className="font-title mb-0.5 font-bold">{title}</div>
            <div className="flex justify-between text-stone-500">
                <div>{getDomain(url)}</div>
                <ResourceStat type="highlights" value={2} />
            </div>

            <div
                className="progress bg-lindy dark:bg-lindyDark absolute bottom-0 left-0 h-[7px] w-full rounded-r transition-all"
                style={{ width: `${reading_progress * 100}%` }}
            />
        </div>
    );
}
