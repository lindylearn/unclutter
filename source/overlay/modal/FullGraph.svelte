<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import ForceGraph, {
        ForceGraphInstance,
        GraphData,
        NodeObject,
    } from "force-graph";
    import { forceManyBody } from "d3-force";

    import { LibraryState } from "../../common/schema";
    import {
        openArticle,
        reportEventContentScript,
    } from "../../content-script/messaging";
    import { getRelativeTime } from "../../common/time";
    import { updateLibraryArticle } from "../../common/api";
    import GraphModalModifier from "../../content-script/modifications/graphModal";

    export let libraryState: LibraryState;
    export let darkModeEnabled: boolean;
    export let graphModalModifier: GraphModalModifier;

    let isExpanded: boolean = true;

    let graphContainer: HTMLDivElement;
    let forceGraph: ForceGraphInstance;
    // render once data available
    $: if (libraryState.graph && graphContainer && !libraryState.isClustering) {
        // re-render only for specific value changes
        forceGraph = renderGraph(
            libraryState.graph,
            graphContainer,
            darkModeEnabled,
            isExpanded
        );
    }
    function renderGraph(
        graph: GraphData,
        graphContainer: HTMLDivElement,
        darkModeEnabled: boolean,
        isExpanded: boolean
    ) {
        console.log("render graph");
        const nodes = graph.nodes;
        const links = graph.links;

        const width = graphContainer.clientWidth;
        const height = graphContainer.clientHeight;
        const NODE_R = 5;

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
            // .cooldownTicks(0)
            .d3Force("center", (alpha) => {
                nodes.forEach((node) => {
                    // different strengths for x and y
                    node.vy -= node.y * alpha * 0.02;
                    node.vx -= node.x * alpha * 0.02;
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
            .nodeVal((n) => 1 + n.linkCount * 0.25)
            .nodeColor((n) => {
                if (darkModeEnabled) {
                    return n.reading_progress >= 0.7
                        ? "rgb(232, 230, 227)"
                        : "#78716c";
                } else {
                    return n.reading_progress >= 0.7 ? "#9ca3af" : "#374151";
                }
            })
            // .nodeColor(
            //     (n) => `rgba(55, 65, 81, ${Math.max(10, 30 - n.days_ago) / 30})`
            // )
            .nodeLabel("none")
            .onNodeHover((node) => {
                hoverNode = node || null;
                graphContainer.style.cursor = node ? "pointer" : null;
            })
            .nodeCanvasObject((node, ctx, globalScale) => {
                if (!isExpanded) {
                    return;
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
                    (node.linkCount >= 3 && globalScale >= 2.5) ||
                    // (node.reading_progress < readingProgressFullClamp && globalScale >= 1) ||
                    globalScale >= 3.5
                ) {
                    // title label
                    let label = node.title?.slice(0, 50);
                    if (node.title?.length > 50) {
                        label = label.concat("…");
                    }
                    const fontSize = 12 / globalScale;

                    ctx.font = `${fontSize}px Work Sans, Sans-Serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = darkModeEnabled ? "#d6d3d1" : "#4b5563";
                    ctx.fillText(label, node.x, node.y + 10);
                }
            })
            .nodeCanvasObjectMode(() => "after")
            // link styling
            .linkLabel("score")
            .linkColor((l) => (darkModeEnabled ? "#44403c" : "#374151"));

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
                .onNodeClick((node, event) => {
                    openArticle(node.url);
                    reportEventContentScript("clickGraphArticle", {
                        libraryUser: libraryState.libraryUser,
                    });
                });
        } else {
            forceGraph
                .enableNodeDrag(false)
                .enableZoomInteraction(false)
                .enablePanInteraction(false);
        }

        return forceGraph;
    }

    let currentZoom = 1;
    let changedZoom = false;
    function onZoomButton(isPlus: boolean) {
        forceGraph.zoom(currentZoom + (isPlus ? 0.25 : -0.25), 200);
        changedZoom = true;
    }
</script>

<div
    class="h-full w-full overflow-hidden rounded-lg"
    bind:this={graphContainer}
    in:fade
/>
