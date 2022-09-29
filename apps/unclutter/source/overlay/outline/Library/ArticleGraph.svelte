<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import ForceGraph, { ForceGraphInstance } from "force-graph";
    import { forceManyBody } from "d3-force";

    import { LibraryState } from "../../../common/schema";
    import { reportEventContentScript } from "../../../content-script/messaging";
    import { getRelativeTime } from "../../../common/time";
    import { updateLibraryArticle } from "../../../common/api";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";
    import {
        CustomGraphData,
        CustomGraphLink,
        CustomGraphNode,
    } from "@unclutter/library-components/dist/components/Modal/Graph";

    export let libraryState: LibraryState;
    export let darkModeEnabled: boolean;
    export let libraryModalModifier: LibraryModalModifier;

    let graphContainer: HTMLDivElement;
    let forceGraph: ForceGraphInstance;
    // render once data available
    $: if (libraryState.graph && graphContainer && !libraryState.isClustering) {
        // re-render only for specific value changes
        renderGraph(libraryState.graph, graphContainer, darkModeEnabled);
    }
    function renderGraph(
        graph: CustomGraphData,
        graphContainer: HTMLDivElement,
        darkModeEnabled: boolean,
        depthLimit = 2
    ) {
        console.log("render graph");
        const nodes = graph.nodes.filter((n) => n.depth <= depthLimit);
        const links = graph.links.filter((n) => n.depth <= depthLimit);

        const width = graphContainer.clientWidth;
        const height = 80; // clientHeight doesn't get updated until the first render
        const NODE_R = 3;

        function byDepth(values: any[]) {
            return (item) => values[item.depth] || values[values.length - 1];
        }

        let hoverNode: CustomGraphNode | null = null;
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
                              "#78716c",
                          ]
                        : ["#374151", "#374151", "#9ca3af"]
                )
            )
            .nodeLabel("none")
            .onNodeHover((node: CustomGraphNode) => {
                hoverNode = node || null;
                graphContainer.style.cursor = node ? "pointer" : null;
            })
            .nodeCanvasObjectMode(() => "after")
            // link styling
            .linkColor(
                byDepth(
                    darkModeEnabled
                        ? [null, "rgb(232, 230, 227)", "#78716c"]
                        : [null, "#374151", "#9ca3af"]
                )
            )
            .linkWidth(byDepth([null, 2, 1]))
            .linkLabel("none");

        // interaction
        forceGraph
            .enableNodeDrag(false)
            .enableZoomInteraction(false)
            .enablePanInteraction(false);

        // zoom
        let initialZoomDone = false;
        forceGraph
            .minZoom(1)
            .maxZoom(2)
            .onEngineStop(() => {
                if (!initialZoomDone) {
                    forceGraph.zoomToFit(
                        0,
                        12,
                        (node: CustomGraphNode) => node.depth <= 1
                    );
                    forceGraph.cooldownTicks(Infinity);
                    initialZoomDone = true;
                }
            });
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
        reportEventContentScript("toggleArticleFavorite", {
            libraryUser: libraryState.libraryUser,
        });
    }

    function openModal(e) {
        libraryModalModifier.showModal();
        e.stopPropagation();
    }
</script>

<div
    class={clsx(
        "library-message relative max-w-full rounded-lg text-sm shadow h-20 cursor-pointer hover:scale-[98%]"
    )}
    on:click={(e) => {
        openModal(e);
    }}
>
    {#if libraryState.graph}
        <div
            class="h-full w-full overflow-hidden rounded-lg"
            bind:this={graphContainer}
            in:fade
        />
        <div
            class="graph-caption absolute top-0 left-0 w-full rounded-t-lg text-gray-600"
            in:fade={{ duration: 200 }}
            out:fade={{ duration: 100 }}
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
                            libraryState.libraryInfo.article.time_added * 1000
                        )}
                    {:else if libraryState.graph.links.filter((l) => l.depth === 1).length > 0}
                        Found {libraryState.graph.links.filter(
                            (l) => l.depth === 1
                        ).length} related articles
                    {:else}
                        Article saved to your library
                    {/if}
                </div>
            </div>
            <!-- <div class="spacer-line border-b-2 border-gray-100" /> -->
        </div>

        <div class="absolute top-1.5 right-1.5 flex gap-1.5">
            {#if isFavorite}
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
            {:else}
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
        </div>
    {:else if libraryState.error}
        <div
            class="flex h-full flex-grow justify-between p-3 pl-5"
            in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        >
            Error while saving article :(
        </div>
    {:else if libraryState.isClustering}
        <div
            class="flex h-full flex-grow justify-between p-3 pl-5"
            in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        >
            Saving article to your library...
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
</style>
