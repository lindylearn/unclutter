<script lang="ts">
    import clsx from "clsx";
    import { LibraryState } from "../../common/schema";
    import GraphModalModifier from "../../content-script/modifications/graphModal";
    import FullGraph from "./FullGraph.svelte";

    export let libraryState: LibraryState;
    export let graphModalModifier: GraphModalModifier;
    export let darkModeEnabled: boolean;
</script>

<div class="relative h-full w-full pt-5">
    <div
        class={clsx(
            "modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out",
            darkModeEnabled
                ? "bg-[rgb(19,21,22)] opacity-50"
                : "bg-stone-800 opacity-50"
        )}
        on:click={() => graphModalModifier.closeModal()}
    />
    <div
        class="modal-content relative z-10 mx-auto h-4/6 w-4/6 rounded-lg px-2 py-2 pr-3 shadow"
    >
        {#if libraryState.graph && !libraryState.isClustering}
            <FullGraph {libraryState} {graphModalModifier} {darkModeEnabled} />
        {/if}
    </div>
</div>

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .modal-content {
        background-color: var(--lindy-background-color);
    }
</style>
