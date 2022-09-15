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
    $: graph = libraryState.graph; // re-render only on graph changes
    $: if (graph && !libraryState.isClustering && graphContainer) {
        console.log("render graph");
        const nodes = graph.nodes;
        const links = graph.links;

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
                return;
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
            .enableNodeDrag(false)
            .enableZoomInteraction(false)
            .enablePanInteraction(false);
        // .onNodeClick((node, event) => window.open(node.id.toString()));

        let initialZoomDone = false;
        forceGraph.onEngineStop(() => {
            if (!initialZoomDone) {
                forceGraph.zoomToFit(0, 5, (node) => node.depth <= 1);
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
        forceGraph.zoom(currentZoom + (isPlus ? 0.5 : -0.5), 200);
        changedZoom = true;
    }
</script>

<div class="library-message relative h-16 max-w-full rounded-lg text-sm shadow">
    {#if graph}
        <div
            class="h-full w-full overflow-hidden rounded-lg"
            bind:this={graphContainer}
            in:fade
        />
        <div class="absolute top-1 right-1 flex flex-col gap-1">
            <!-- <svg class="zoom-icon" viewBox="0 0 448 512"
                ><path
                    fill="currentColor"
                    d="M136 32h-112C10.75 32 0 42.75 0 56v112C0 181.3 10.75 192 24 192C37.26 192 48 181.3 48 168V80h88C149.3 80 160 69.25 160 56S149.3 32 136 32zM424 32h-112C298.7 32 288 42.75 288 56c0 13.26 10.75 24 24 24h88v88C400 181.3 410.7 192 424 192S448 181.3 448 168v-112C448 42.75 437.3 32 424 32zM136 432H48v-88C48 330.7 37.25 320 24 320S0 330.7 0 344v112C0 469.3 10.75 480 24 480h112C149.3 480 160 469.3 160 456C160 442.7 149.3 432 136 432zM424 320c-13.26 0-24 10.75-24 24v88h-88c-13.26 0-24 10.75-24 24S298.7 480 312 480h112c13.25 0 24-10.75 24-24v-112C448 330.7 437.3 320 424 320z"
                /></svg
            > -->
            <!-- <svg
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
            > -->
        </div>
        <!-- {#if !changedZoom}
            <div
                class="links-message absolute bottom-0 right-0 select-none rounded-tl-md rounded-br-lg p-1 pr-1.5 text-sm leading-none"
                out:fade
            >
                {graph.links.filter((l) => l.depth === 1).length}
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
    .graph-tooltip {
        position: absolute;
        width: 200px;
        margin-left: -100px;
        margin-top: 10px;

        @apply cursor-pointer bg-none text-center text-sm leading-none;
    }

    .zoom-icon {
        color: #6b7280;
        @apply w-[18px] cursor-pointer rounded-md bg-gray-100 p-1 shadow-sm transition-transform hover:scale-95;
    }
    .zoom-icon > path {
        stroke: currentColor;
        stroke-width: 30px;
    }

    .links-message {
        @apply text-gray-500;
        background-color: var(--lindy-background-color);
    }
</style>
