<script lang="ts">
    import { onMount } from "svelte";
    import browser from "../../../common/polyfill";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import ForceGraph, {
        ForceGraphInstance,
        GraphData,
        NodeObject,
    } from "force-graph";
    import { forceManyBody } from "d3-force";

    import { LibraryState } from "../../../common/schema";
    import {
        openArticle,
        reportEventContentScript,
    } from "../../../content-script/messaging";

    export let libraryState: LibraryState;
    export let darkModeEnabled: boolean;

    let isExpanded: boolean = false;

    let graphContainer: HTMLDivElement;
    let forceGraph: ForceGraphInstance;
    // render once data available
    $: if (libraryState.graph && graphContainer && !libraryState.isClustering) {
        // re-render only for specific value changes
        renderGraph(
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
        const height = isExpanded ? 208 : 80; // clientHeight doesn't get updated until the first render
        const NODE_R = 3;

        function byDepth(values: any[]) {
            return (item) => values[item.depth] || values[values.length - 1];
        }

        let hoverNode: NodeObject | null = null;
        forceGraph = ForceGraph()(graphContainer)
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
                nodes.forEach((node) => {
                    // different strengths for x and y
                    node.vy -= node.y * alpha * 0.15;
                    node.vx -= node.x * alpha * 0.05;
                });
            })
            .d3Force(
                "charge",
                forceManyBody().strength(byDepth([-30, -40, -20]))
            )
            // .onEngineTick(() => {
            //     // forces nodes inside bounding box
            //     nodes.forEach((node) => {
            //         // uses 2x resolution and origin is in center
            //         node.x = Math.max(
            //             -width / 4 - 10,
            //             Math.min(width / 4 + 10, node.x)
            //         );
            //         node.y = Math.max(
            //             -height / 4,
            //             Math.min(height / 4, node.y)
            //         );
            //     });
            // })
            // node styling
            .nodeRelSize(NODE_R)
            .nodeVal(byDepth([2, 1]))
            .nodeColor(
                byDepth(
                    darkModeEnabled
                        ? [
                              "rgb(232, 230, 227)",
                              "rgb(232, 230, 227)",
                              "#57534e",
                          ]
                        : ["#374151", "#374151", "#9ca3af"]
                )
            )
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
                    (node.depth === 1 && globalScale >= 1.5) ||
                    (node.depth === 2 && globalScale >= 2.5) ||
                    (node.depth === 3 && globalScale >= 3.5)
                ) {
                    // title label
                    const label = node.name.slice(0, 30);
                    const fontSize = 10 / globalScale;

                    ctx.font = `${fontSize}px Work Sans, Sans-Serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = darkModeEnabled ? "#d6d3d1" : "#4b5563";
                    ctx.fillText(label, node.x, node.y + 5);
                }
            })
            .nodeCanvasObjectMode(() => "before")
            // link styling
            .linkColor(
                byDepth(
                    darkModeEnabled
                        ? [null, "rgb(232, 230, 227)", "#57534e"]
                        : [null, "#374151", "#9ca3af"]
                )
            )
            .linkWidth(byDepth([null, 2, 1]))
            .linkLabel("none");

        // interaction
        if (isExpanded) {
            forceGraph
                // .autoPauseRedraw(false) // re-render nodes on hover
                .onNodeClick((node, event) => {
                    openArticle(node.id.toString());
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

        // zoom
        let initialZoomDone = false;
        forceGraph
            .minZoom(1)
            .maxZoom(isExpanded ? 4 : 2)
            .onEngineStop(() => {
                if (!initialZoomDone) {
                    forceGraph.zoomToFit(
                        0,
                        10,
                        (node) => node.depth <= (isExpanded ? 2 : 1)
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
            currentZoom = zoom.k;
        });
    }

    let currentZoom = 1;
    let changedZoom = false;
    function onZoomButton(isPlus: boolean) {
        forceGraph.zoom(currentZoom + (isPlus ? 0.25 : -0.25), 200);
        changedZoom = true;
    }

    function toggleExpanded(e) {
        isExpanded = !isExpanded;
        if (isExpanded) {
            reportEventContentScript("expandArticleGraph", {
                libraryUser: libraryState.libraryUser,
            });
        }

        e.stopPropagation();
    }
</script>

<div
    class={clsx(
        "library-message relative max-w-full rounded-lg text-sm shadow h-20",
        isExpanded && "is-expanded",
        !isExpanded && libraryState.graph && "cursor-pointer hover:scale-[99%]"
    )}
    on:click={(e) => {
        if (!isExpanded) {
            toggleExpanded(e);
        }
    }}
>
    {#if libraryState.graph}
        <div
            class="h-full w-full overflow-hidden rounded-lg"
            bind:this={graphContainer}
            in:fade
        />
        <div class="absolute top-1 right-1 flex flex-col gap-1">
            <!-- {#if isExpanded}
                <svg
                    class="zoom-icon"
                    viewBox="0 0 448 512"
                    on:click={() => onZoomButton(true)}
                    in:fade
                    ><path
                        fill="currentColor"
                        d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                    /></svg
                >
                <svg
                    class="zoom-icon"
                    viewBox="0 0 448 512"
                    on:click={() => onZoomButton(false)}
                    in:fade
                    ><path
                        fill="currentColor"
                        d="M432 256C432 269.3 421.3 280 408 280H40c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h368C421.3 232 432 242.8 432 256z"
                    /></svg
                >
            {:else} -->
            <svg
                class={clsx(
                    "zoom-icon transition-transform",
                    isExpanded && "rotate-180"
                )}
                viewBox="0 0 384 512"
                on:click={toggleExpanded}
                in:fade
            >
                <path
                    fill="currentColor"
                    d="M360.5 217.5l-152 143.1C203.9 365.8 197.9 368 192 368s-11.88-2.188-16.5-6.562L23.5 217.5C13.87 208.3 13.47 193.1 22.56 183.5C31.69 173.8 46.94 173.5 56.5 182.6L192 310.9l135.5-128.4c9.562-9.094 24.75-8.75 33.94 .9375C370.5 193.1 370.1 208.3 360.5 217.5z"
                />
            </svg>
        </div>
        <!-- {#if !changedZoom}
            <div
                class="links-message absolute bottom-0 right-0 select-none rounded-tl-md rounded-br-lg p-1 pr-1.5 text-sm leading-none"
                out:fade
            >
                {libraryState.graph.links.filter((l) => l.depth === 1).length}
                new links
            </div>
        {/if} -->
    {:else if libraryState.error}
        <div
            class="flex h-full flex-grow justify-between p-3 pl-5"
            in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        >
            Error adding article :(
        </div>
    {:else if libraryState.isClustering}
        <div
            class="flex h-full flex-grow justify-between p-3 pl-5"
            in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        >
            Adding to your library...
        </div>
    {/if}
</div>

<style lang="postcss" global>
    .library-message {
        /* background transition overrides transform otherwise */
        transition: background 0.3s ease-in-out 0.1s,
            transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
            height 150ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .library-message.is-expanded {
        @apply h-52;
    }

    .graph-tooltip {
        position: absolute;
        width: 200px;
        margin-left: -100px;
        margin-top: 10px;

        @apply cursor-pointer bg-none text-center text-sm leading-none;
    }

    .zoom-icon {
        color: #6b7280;
        @apply w-[18px] cursor-pointer rounded-md bg-gray-100 p-1 shadow-sm transition-all hover:scale-90 hover:shadow;
    }
    .zoom-icon > path {
        stroke: currentColor;
        stroke-width: 30px;
    }

    .links-message {
        @apply text-gray-400;
        background-color: var(--lindy-background-color);
    }
</style>
