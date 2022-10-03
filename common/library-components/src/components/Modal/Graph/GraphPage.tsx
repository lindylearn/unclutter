import React, { useEffect, useRef, useState } from "react";
import ForceGraph, { NodeObject, LinkObject } from "force-graph";
import { forceManyBody } from "d3-force";
import clsx from "clsx";

import { openArticle } from "../../../common";
import { CustomGraphData, CustomGraphNode } from "./data";
import { renderNodeObject } from "./canvas";

export function GraphPage({
    graph,
    darkModeEnabled,
}: {
    graph?: CustomGraphData;
    darkModeEnabled: boolean;
}) {
    const [renderDone, setRenderDone] = useState(false);

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current || !graph) {
            return;
        }

        // wait a bit during intro animation for performance
        const isInitialRender = graph.nodes[0].x === undefined;
        setTimeout(
            () => {
                renderGraph(
                    graph,
                    ref.current!,
                    darkModeEnabled,
                    setRenderDone
                );
            },
            isInitialRender ? 50 : 0
        );
    }, [ref, graph]);

    return (
        <div
            className={clsx(
                "graph h-full w-full cursor-move overflow-hidden rounded-md bg-stone-50 dark:bg-neutral-800",
                renderDone && "render-done"
            )}
            ref={ref}
        >
            <div className="node-tooltip">Test title</div>
        </div>
    );
}

export type RuntimeNode = CustomGraphNode & {
    x: number;
    y: number;
    vx: number;
    vy: number;
};

function renderGraph(
    graph: CustomGraphData,
    graphContainer: HTMLDivElement,
    darkModeEnabled: boolean,
    setRenderDone: (done: boolean) => void
) {
    console.log(`rendering graph with ${graph.nodes.length} nodes`);
    const nodes = graph.nodes.filter((n) => n.depth !== 100);
    const links = graph.links.filter((n) => n.depth !== 100);

    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;
    const NODE_R = 3;

    function byDepth(values: any[]) {
        return (item) => values[item.depth] || values[values.length - 1];
    }

    let hoverNode: NodeObject | null = null;
    let forceGraph = ForceGraph()(graphContainer)
        // layout
        .graphData({ nodes, links })
        .width(width)
        .height(height)
        // simulation props
        .d3AlphaDecay(0.01)
        .d3VelocityDecay(0.08)
        .warmupTicks(nodes[0].x === undefined ? 100 : 0) // use previous positions if available
        .cooldownTicks(0)
        .d3Force("center", (alpha) => {
            nodes.forEach((node: RuntimeNode) => {
                // different strengths for x and y
                node.vy -= node.y * alpha * 0.05;
                node.vx -= node.x * alpha * 0.05;
            });
        })
        .d3Force(
            "charge",
            forceManyBody().strength(byDepth([-50, -50, -40, -20]))
        )
        // node styling
        .nodeRelSize(NODE_R)
        .nodeVal((n: RuntimeNode) => (n.depth === 0 ? 2 : 1))
        .nodeColor(
            byDepth(
                darkModeEnabled
                    ? ["hsl(51, 80%, 43%)", "hsl(51, 80%, 43%)", "#78716c"]
                    : ["hsl(51, 80%, 64%)", "hsl(51, 80%, 64%)", "#d6d3d1"]
            )
        )
        .nodeLabel("none")
        .onNodeHover((node) => {
            hoverNode = node || null;
            graphContainer.style.cursor = node ? "pointer" : "move";
        })
        .nodeCanvasObject(renderNodeObject(darkModeEnabled, NODE_R))
        .nodeCanvasObjectMode(() => "after")
        // link styling
        .linkLabel("score")
        .linkWidth(byDepth([null, 4, 2]))
        .linkColor(
            byDepth(
                darkModeEnabled
                    ? [null, "hsl(51, 80%, 43%)", "#78716c"]
                    : [null, "hsl(51, 80%, 64%)", "#d6d3d1"]
            )
        );

    // forceGraph.d3Force(
    //     "link",
    //     forceGraph.d3Force("link").distance((l) => l.score * 100)
    // );
    // .d3Force(
    //     "link",
    //     forceLink(links)
    //         .id((n) => n.id)
    //         .strength((l) => l.score)
    // )

    // interaction
    forceGraph
        // .autoPauseRedraw(false) // re-render nodes on hover
        .minZoom(0.5)
        .onNodeClick((node: RuntimeNode, event) => {
            openArticle(node.url);
            // reportEventContentScript("clickGraphArticle", {
            //     libraryUser: libraryState.libraryUser,
            // });
        });

    // zoom
    let initialZoomDone = false;
    let changedZoom = false;
    let currentZoom: number;
    forceGraph
        .minZoom(0.5)
        .maxZoom(4)
        .onEngineStop(() => {
            if (!initialZoomDone) {
                forceGraph.zoomToFit(
                    0,
                    50,
                    (node: RuntimeNode) => node.depth <= 2
                );
                forceGraph.cooldownTicks(Infinity);
                initialZoomDone = true;

                // track user zoom changes only after initial zoom
                forceGraph.onZoom((zoom) => {
                    changedZoom = true;
                });

                setRenderDone(true);
            }
        });

    forceGraph.onZoom((zoom) => {
        // console.log(zoom.k);
        currentZoom = zoom.k;
    });

    return forceGraph;
}
