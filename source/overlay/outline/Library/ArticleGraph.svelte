<script lang="ts">
    import { onMount } from "svelte";
    import browser from "../../../common/polyfill";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import ForceGraph from "force-graph";

    import { LibraryState } from "../../../common/schema";

    export let libraryState: LibraryState;

    let graphContainer: HTMLDivElement;
    $: if (libraryState.graph && graphContainer) {
        const nodes = libraryState.graph.nodes;
        const links = libraryState.graph.links;

        const width = graphContainer.clientWidth;
        const height = 100;

        const forceGraph = ForceGraph()(graphContainer)
            // layout
            .graphData({ nodes, links })
            .width(width)
            .height(height)
            // simulation props
            .d3AlphaDecay(0.01)
            .d3VelocityDecay(0.08)
            // .warmupTicks(100)
            // .cooldownTicks(0);
            .d3Force("center", (alpha) => {
                nodes.forEach((node) => {
                    // different strengths for x and y
                    node.vy -= node.y * alpha * 0.2;
                    node.vx -= node.x * alpha * 0.05;
                });
            })
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
            .nodeColor(() => "rgba(0, 229, 255, 0.8)")
            .linkColor(() => "#9ca3af")
            // interaction
            .enableZoomInteraction(false)
            .enablePanInteraction(false)
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
    }
</style>
