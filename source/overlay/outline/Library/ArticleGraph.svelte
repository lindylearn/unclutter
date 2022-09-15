<script lang="ts">
    import { onMount } from "svelte";
    import browser from "../../../common/polyfill";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import ForceGraph, { ForceGraphInstance } from "force-graph";
    import { forceManyBody } from "d3-force";

    import { LibraryState } from "../../../common/schema";

    export let libraryState: LibraryState;
    export let darkModeEnabled: boolean;

    let graphContainer: HTMLDivElement;
    let forceGraph: ForceGraphInstance;
    $: if (libraryState.graph && graphContainer) {
        console.log("render");
        const nodes = libraryState.graph.nodes;
        const links = libraryState.graph.links;

        const width = graphContainer.clientWidth;
        const height = graphContainer.clientHeight;

        function byDepth(values: any[]) {
            return (item) => values[item.depth] || values[values.length - 1];
        }

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
                    node.vy -= node.y * alpha * 0.1;
                    node.vx -= node.x * alpha * 0.02;
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
            // styling
            .nodeRelSize(3)
            .nodeVal(byDepth([2, 1]))
            .nodeColor(
                byDepth(
                    darkModeEnabled
                        ? [
                              "rgb(232, 230, 227)",
                              "rgb(232, 230, 227)",
                              "#57534e",
                          ]
                        : ["#374151", "#374151", "#6b7280"]
                )
            )
            .nodeLabel("none")
            .linkColor(
                byDepth(
                    darkModeEnabled
                        ? [null, "rgb(232, 230, 227)", "#57534e"]
                        : [null, "#374151", "#6b7280"]
                )
            )
            .linkWidth(byDepth([null, 2, 1]))
            .linkLabel("none")
            .nodeCanvasObject((node, ctx, globalScale) => {
                if (node.depth === 1) {
                    // title label
                    const label = node.name.slice(0, 30);
                    const fontSize = 10 / globalScale;
                    ctx.font = `${fontSize}px Work Sans, Sans-Serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = darkModeEnabled ? "#d6d3d1" : "#4b5563";
                    ctx.fillText(label, node.x, node.y + 7);
                }
            })
            .nodeCanvasObjectMode(() => "after")
            // interaction
            // .enableZoomInteraction(false)
            // .enablePanInteraction(false)
            .onNodeClick((node, event) => window.open(node.id.toString()));

        let initialZoomDone = false;
        forceGraph.onEngineStop(() => {
            if (!initialZoomDone) {
                forceGraph.zoomToFit(0, 10, (node) => node.depth <= 1);
                forceGraph.cooldownTicks(Infinity);
                initialZoomDone = true;
            }
        });

        forceGraph.onZoom((zoom) => {
            currentZoom = zoom.k;
        });
    }

    let currentZoom = 1;
    function onZoomButton(isPlus: boolean) {
        forceGraph.zoom(currentZoom + (isPlus ? 1 : -1), 200);
    }
</script>

<div class="library-message relative h-28 max-w-full rounded-lg text-sm shadow">
    {#if libraryState.graph}
        <div
            class="h-full w-full overflow-hidden rounded-lg"
            bind:this={graphContainer}
            in:fade
        />
        <div class="absolute top-1 right-1 flex flex-col gap-1">
            <svg
                class="zoom-icon"
                viewBox="0 0 448 512"
                on:click={() => onZoomButton(true)}
                ><path
                    fill="currentColor"
                    d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                /></svg
            >
            <svg
                class="zoom-icon"
                viewBox="0 0 448 512"
                on:click={() => onZoomButton(false)}
                ><path
                    fill="currentColor"
                    d="M432 256C432 269.3 421.3 280 408 280H40c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h368C421.3 232 432 242.8 432 256z"
                /></svg
            >
        </div>
        <div
            class="links-message absolute bottom-0 right-0 select-none rounded-tl-md rounded-br-lg p-1 text-sm leading-none"
        >
            {libraryState.graph.links.filter((l) => l.depth === 1).length} new library
            links
        </div>
    {:else}
        <div
            class="flex h-full flex-grow justify-between p-3"
            in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        >
            {#if libraryState.libraryInfo}
                Fetching graph
            {:else if libraryState.error}
                Error adding article :(
            {:else if libraryState.isClustering}
                Adding article to your library
            {/if}
        </div>
    {/if}
</div>

<style lang="postcss" global>
    .graph-tooltip {
        position: absolute;
        width: 200px;
        margin-left: -100px;
        margin-top: 10px;

        @apply cursor-pointer bg-none text-center text-sm leading-none;
    }

    .zoom-icon {
        color: #6b7280;
        @apply w-[18px] cursor-pointer rounded-md bg-gray-100 p-1;
    }
    .zoom-icon > path {
        stroke: currentColor;
        stroke-width: 30px;
    }

    .links-message {
        color: #4b5563;
        /* background-color: var(--lindy-background-color); */
    }
</style>
