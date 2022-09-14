<script lang="ts">
    import { onMount } from "svelte";
    import browser from "../../../common/polyfill";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import ForceGraph from "force-graph";
    import { forceManyBody } from "d3-force";

    import { LibraryState } from "../../../common/schema";

    export let libraryState: LibraryState;

    let graphContainer: HTMLDivElement;
    $: if (libraryState.graph && graphContainer) {
        const nodes = libraryState.graph.nodes;
        const links = libraryState.graph.links;

        const width = graphContainer.clientWidth;
        const height = graphContainer.clientHeight;

        function byDepth(values: any[]) {
            return (item) => values[item.depth] || values[values.length - 1];
        }

        const forceGraph = ForceGraph()(graphContainer)
            // layout
            .graphData({ nodes, links })
            .width(width)
            .height(height)
            // simulation props
            // .d3AlphaDecay(0.01)
            // .d3VelocityDecay(0.08)
            .warmupTicks(100)
            .cooldownTicks(0)
            .d3Force("center", (alpha) => {
                nodes.forEach((node) => {
                    // different strengths for x and y
                    node.vy -= node.y * alpha * 0.2;
                    node.vx -= node.x * alpha * 0.1;
                });
            })
            .d3Force(
                "charge",
                forceManyBody().strength(byDepth([-50, -40, -20]))
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
                byDepth(["rgb(232, 230, 227)", "rgb(232, 230, 227)", "#57534e"])
            )
            .linkColor(byDepth([null, "rgb(232, 230, 227)", "#57534e"]))
            .linkWidth(byDepth([null, 2, 1]))
            .nodeCanvasObject((node, ctx, globalScale) => {})
            .nodeCanvasObjectMode(() => "after")
            // interaction
            // .enableZoomInteraction(false)
            // .enablePanInteraction(false)
            .onNodeClick((node, event) => window.open(node.id.toString()));

        forceGraph.onEngineStop(() => {
            forceGraph.zoomToFit(0, 20, (node) => node.depth <= 1);
            forceGraph.cooldownTicks(Infinity);
        });
    }
</script>

<div class="library-message relative h-24 max-w-full rounded-lg shadow">
    {#if libraryState.libraryInfo}
        <div class="h-full w-full" bind:this={graphContainer} in:fade />
        <!-- <div class="absolute bottom-1 right-2 text-sm">3 new connections</div> -->
    {:else if libraryState.error}
        Error adding article :(
    {:else if libraryState.isClustering}
        <div
            class="flex h-full flex-grow justify-between"
            in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        >
            <div>Adding to your library...</div>
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
</style>
