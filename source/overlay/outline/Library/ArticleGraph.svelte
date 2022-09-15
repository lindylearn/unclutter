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
    import { getRelativeTime } from "../../../common/time";
    import { updateLibraryArticle } from "../../../common/api";

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
                    const fontSize = 11 / globalScale;

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
                        12,
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

    let isFavorite: boolean = null;
    $: isFavorite = libraryState.libraryInfo?.article.is_favorite;
    function toggleFavorite() {
        isFavorite = !isFavorite;
        updateLibraryArticle(
            libraryState.libraryInfo.article.url,
            libraryState.libraryUser,
            {
                is_favorite: isFavorite,
            }
        );
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
        {#if isExpanded && !changedZoom}
            <div
                class="absolute top-0 left-0 w-full rounded-t-lg text-gray-600"
                in:fade
                out:fade
            >
                <div class="flex items-center p-2 pl-5">
                    <!-- <div class="flex h-0 w-3 flex-shrink-0 items-center">
                        <div class="w-5 flex-shrink-0 cursor-pointer">
                            <LindyIcon />
                        </div>
                    </div> -->
                    <div class="select-none text-sm">
                        {#if libraryState.wasAlreadyPresent && libraryState.libraryInfo.article.time_added}
                            Saved {getRelativeTime(
                                libraryState.libraryInfo.article.time_added *
                                    1000
                            )}
                        {:else}
                            Added {libraryState.graph.links.filter(
                                (l) => l.depth === 1
                            ).length} library links
                        {/if}
                    </div>
                </div>
                <!-- <div class="spacer-line border-b-2 border-gray-100" /> -->
            </div>
        {/if}

        <div class="absolute top-1.5 right-1.5 flex gap-1.5">
            {#if isExpanded && isFavorite}
                <svg
                    viewBox="0 0 576 512"
                    class="graph-icon star-icon star-full"
                    on:click={toggleFavorite}
                >
                    <path
                        fill="currentColor"
                        d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
                    />
                </svg>
            {:else if isExpanded}
                <svg
                    class="graph-icon star-icon"
                    viewBox="0 0 576 512"
                    on:click={toggleFavorite}
                >
                    <path
                        fill="currentColor"
                        d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"
                    />
                </svg>
            {/if}

            <svg
                class="graph-icon"
                viewBox="0 0 384 512"
                on:click={toggleExpanded}
                in:fade
            >
                <path
                    class={clsx(
                        "transition-transform origin-center",
                        isExpanded && "rotate-180"
                    )}
                    fill="currentColor"
                    d="M360.5 217.5l-152 143.1C203.9 365.8 197.9 368 192 368s-11.88-2.188-16.5-6.562L23.5 217.5C13.87 208.3 13.47 193.1 22.56 183.5C31.69 173.8 46.94 173.5 56.5 182.6L192 310.9l135.5-128.4c9.562-9.094 24.75-8.75 33.94 .9375C370.5 193.1 370.1 208.3 360.5 217.5z"
                />
            </svg>
        </div>
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

    .graph-icon {
        color: #6b7280;
        @apply w-[18px] cursor-pointer rounded-md bg-gray-100 p-1 shadow-sm transition-all hover:scale-90 hover:shadow;
    }
    .graph-icon > path {
        stroke: currentColor;
        stroke-width: 25px;
    }
    .star-icon {
        width: 20px !important;
    }
    .star-full {
        color: hsl(51, 80%, 64%);
        background-color: hsl(51, 80%, 90%);
    }

    .links-message {
        @apply text-gray-400;
        background-color: var(--lindy-background-color);
    }
</style>
