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
        const height = 100;

        function byDepth(values: any[]) {
            return (item) => values[item.depth] || values[values.length - 1];
        }

        const forceGraph = ForceGraph()(graphContainer)
            // layout
            .graphData({ nodes, links })
            .width(width)
            .height(height)
            // simulation props
            .d3AlphaDecay(0.01)
            .d3VelocityDecay(0.08)
            .warmupTicks(100)
            // .cooldownTicks(0);
            .d3Force("center", (alpha) => {
                nodes.forEach((node) => {
                    // different strengths for x and y
                    node.vy -= node.y * alpha * 0.2;
                    node.vx -= node.x * alpha * 0.1;
                });
            })
            // .d3Force(
            //     "charge",
            //     forceManyBody().strength(byDepth([-40, -30, -20]))
            // )
            .onEngineTick(() => {
                // forces nodes inside bounding box
                nodes.forEach((node) => {
                    // uses 2x resolution and origin is in center
                    node.x = Math.max(
                        -width / 4 - 10,
                        Math.min(width / 4 + 10, node.x)
                    );
                    node.y = Math.max(
                        -height / 4,
                        Math.min(height / 4, node.y)
                    );
                });
            })
            // styling
            .nodeRelSize(3)
            .nodeColor(byDepth(["#374151", "#374151", "#9ca3af"]))
            .linkColor(byDepth([null, "#374151", "#9ca3af"]))
            .linkWidth(byDepth([null, 2, 1]))
            .nodeCanvasObject((node, ctx, globalScale) => {})
            .nodeCanvasObjectMode(() => "after")
            // interaction
            // .enableZoomInteraction(false)
            // .enablePanInteraction(false)
            .onNodeClick((node, event) => window.open(node.id.toString()));
    }
</script>

<div
    class="library-message relative max-w-full rounded-lg shadow"
    bind:this={graphContainer}
/>

<style lang="postcss" global>
    .graph-tooltip {
        position: absolute;
        width: 200px;
        margin-left: -100px;
        margin-top: 10px;
        @apply cursor-pointer bg-none text-center text-sm leading-none text-gray-700;
    }
</style>
