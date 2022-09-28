import { openArticle } from "../../common";
import {
    Article,
    ArticleLink,
    RuntimeReplicache,
    readingProgressFullClamp,
    ReplicacheContext,
} from "../../store";
import React, { useContext, useEffect, useRef, useState } from "react";
import ForceGraph, { NodeObject, LinkObject } from "force-graph";

export default function GraphModalTab({ articleUrl, darkModeEnabled }) {
    const rep = useContext(ReplicacheContext);
    const [graph, setGraph] = useState<CustomGraphData>();
    useEffect(() => {
        if (!rep) {
            return;
        }

        (async () => {
            const graph = await getFullGraphData(rep, articleUrl);
            setGraph(graph);
        })();
    }, [rep]);

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current || !graph) {
            return;
        }

        renderGraph(graph, ref.current, darkModeEnabled, true);
    }, [ref, graph]);

    return (
        <div
            className="graph h-full w-full rounded-md dark:bg-neutral-800"
            ref={ref}
        />
    );
}

type CustomGraphData = {
    nodes: CustomGraphNode[];
    links: CustomGraphLink[];
};
type CustomGraphNode = NodeObject &
    Article & {
        depth: number;
        linkCount: number;
        days_ago: number;
    };
type CustomGraphLink = LinkObject & {
    depth?: number;
};

async function getFullGraphData(
    rep: RuntimeReplicache,
    articleUrl: string
): Promise<CustomGraphData> {
    // fetch filtered data
    const start = new Date();
    start.setDate(start.getDate() - 90);
    let nodes: Article[] = await rep.query.listRecentArticles(start.getTime());
    // let nodes = await rep.query(listArticles);
    let links: ArticleLink[] = await rep.query.listArticleLinks();

    // only consider links of filtered articles
    const nodeIndexById = nodes.reduce((acc, node, index) => {
        acc[node.id] = index;
        return acc;
    }, {});
    links = links.filter(
        (l) =>
            nodeIndexById[l.source] !== undefined &&
            nodeIndexById[l.target] !== undefined
    );

    // save links per node
    const linksPerNode: { [id: string]: ArticleLink[] } = {};
    links.map((l) => {
        linksPerNode[l.source] = [...(linksPerNode[l.source] || []), l];
        linksPerNode[l.target] = [...(linksPerNode[l.target] || []), l];
    });

    // filter number of links per node
    const customLinks: CustomGraphLink[] = [];
    const filteredLinksPerNode: { [id: string]: ArticleLink[] } = {};
    for (const [id, ls] of Object.entries(linksPerNode)) {
        const filteredLinks = ls
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 3);

        for (const l of filteredLinks) {
            if (l["_index"] !== undefined) {
                // skip duplicate links
                continue;
            }
            l["_index"] = customLinks.length;
            customLinks.push(l);

            filteredLinksPerNode[l.source] = [
                ...(filteredLinksPerNode[l.source] || []),
                l,
            ];
            filteredLinksPerNode[l.target] = [
                ...(filteredLinksPerNode[l.target] || []),
                // reverse link
                {
                    ...l,
                    source: l.target,
                    target: l.source,
                },
            ];
        }
    }

    const customNodes: CustomGraphNode[] = nodes.map((node, index) => {
        return {
            ...node,
            linkCount: filteredLinksPerNode[node.id]?.length || 0,
            days_ago: (Date.now() - node.time_added * 1000) / 86400000,
            depth: 100, // makes depth checks easier
        };
    });

    // spanning tree
    // const mstLinks = kruskal(
    //     customLinks.map((l) => ({
    //         ...l,
    //         from: l.source,
    //         to: l.target,
    //         weight: 1 - l.score!,
    //     }))
    // );
    // setGraph({ nodes :customNodes, links: mstLinks });

    // add depth from current url
    const maxDepth = 2;
    const startNode = customNodes.find((n) => n.url === articleUrl);
    if (startNode) {
        startNode.depth = 0;
        const queue = [startNode];
        while (queue.length > 0) {
            const node = queue.shift();
            if (!node || (node.depth !== 100 && node.depth >= maxDepth)) {
                break;
            }

            const adjacentLinks = filteredLinksPerNode[node.id] || [];
            adjacentLinks.map((l) => {
                const targetNode = customNodes[nodeIndexById[l.target]];
                if (targetNode && targetNode.depth === 100) {
                    targetNode.depth = node.depth + 1;
                    customLinks[l["_index"]].depth = node.depth + 1;

                    queue.push(targetNode);
                }
            });
        }
    }

    return { nodes: customNodes, links: customLinks };
}

type RuntimeNode = CustomGraphNode & {
    x: number;
    y: number;
    vx: number;
    vy: number;
};

function renderGraph(
    graph: CustomGraphData,
    graphContainer: HTMLDivElement,
    darkModeEnabled: boolean,
    isExpanded: boolean
) {
    console.log("render graph");
    const nodes = graph.nodes;
    const links = graph.links;

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
        .warmupTicks(100)
        .cooldownTicks(0)
        .d3Force("center", (alpha) => {
            nodes.forEach((node: RuntimeNode) => {
                // different strengths for x and y
                node.vy -= node.y * alpha * 0.05;
                node.vx -= node.x * alpha * 0.05;
            });
        })
        // .d3Force("charge", forceManyBody().strength(byDepth([-30, -40, -20])))
        // .onEngineTick(() => {
        //     // forces nodes inside bounding box
        //     nodes.forEach((node) => {
        //         // uses 2x resolution and origin is in center
        //         const scale = 1;

        //         node.x = Math.max(
        //             -width / scale - 10,
        //             Math.min(width / scale + 10, node.x)
        //         );
        //         node.y = Math.max(
        //             -height / scale,
        //             Math.min(height / scale, node.y)
        //         );
        //     });
        // })
        // node styling
        .nodeRelSize(NODE_R)
        .nodeVal((n: RuntimeNode) => (n.depth === 0 ? 3 : 1))
        .nodeColor(
            byDepth(
                darkModeEnabled
                    ? ["hsl(51, 80%, 43%)", "hsl(51, 80%, 43%)", "#78716c"]
                    : ["hsl(51, 80%, 64%)", "hsl(51, 80%, 64%)", "#9ca3af"]
            )
        )
        .nodeLabel("none")
        .onNodeHover((node) => {
            hoverNode = node || null;
            graphContainer.style.cursor = node ? "pointer" : "default";
        })
        .nodeCanvasObject((node: RuntimeNode, ctx, globalScale) => {
            if (!isExpanded) {
                return;
            }

            if (
                node.reading_progress < readingProgressFullClamp &&
                node.depth !== 0
            ) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, NODE_R * 0.6, 0, 2 * Math.PI);
                ctx.fillStyle = darkModeEnabled ? "#212121" : "white";

                ctx.fill();
            }
            // if (node.id === hoverNode?.id) {
            //     ctx.beginPath();
            //     ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI);
            //     ctx.fillStyle = darkModeEnabled ? "#d6d3d1" : "#4b5563";

            //     ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
            //     ctx.shadowOffsetX = 0;
            //     ctx.shadowOffsetY = 1;
            //     ctx.shadowBlur = 10;

            //     ctx.fill();

            //     // reset shadow
            //     ctx.shadowColor = "transparent";
            // }
            if (
                (node.linkCount >= 5 && globalScale >= 1) ||
                (node.depth <= 1 && globalScale >= 2) ||
                (node.depth <= 2 && globalScale >= 2.5) ||
                globalScale >= 3.5
            ) {
                // title label
                if (!node.title) {
                    return;
                }

                let label = node.title?.slice(0, 30);
                if (node.title.length > 30) {
                    label = label.concat("…");
                }

                const fontSize = 12 / globalScale;
                ctx.font = `${fontSize}px Work Sans, Sans-Serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                if (node.depth <= 1 || node.linkCount >= 5) {
                    ctx.fillStyle = darkModeEnabled
                        ? "rgb(232, 230, 227)"
                        : "#374151";
                } else {
                    ctx.fillStyle = darkModeEnabled
                        ? "rgb(232, 230, 227, 50%)"
                        : "#4b5563";
                }

                ctx.fillText(label, node.x, node.y + 5);
            }
        })
        .nodeCanvasObjectMode(() => "after")
        // link styling
        .linkLabel("score")
        .linkWidth(byDepth([null, 3, 1]))
        .linkColor(
            byDepth(
                darkModeEnabled
                    ? [null, "hsl(51, 80%, 43%)", "#78716c"]
                    : [null, "hsl(51, 80%, 64%)", "#9ca3af"]
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
    if (isExpanded) {
        forceGraph
            // .autoPauseRedraw(false) // re-render nodes on hover
            .minZoom(0.5)
            .onNodeClick((node: RuntimeNode, event) => {
                openArticle(node.url);
                // reportEventContentScript("clickGraphArticle", {
                //     libraryUser: libraryState.libraryUser,
                // });
            });
    } else {
        forceGraph
            .enableNodeDrag(false)
            .enableZoomInteraction(false)
            .enablePanInteraction(false);
    }

    // zoom
    let initialZoomDone = false;
    let changedZoom = false;
    let currentZoom;
    forceGraph
        .minZoom(0.5)
        .maxZoom(isExpanded ? 4 : 2)
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
            }
        });

    forceGraph.onZoom((zoom) => {
        // console.log(zoom.k);
        currentZoom = zoom.k;
    });

    return forceGraph;
}
