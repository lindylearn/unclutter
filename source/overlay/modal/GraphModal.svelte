<script lang="ts">
    import GraphModalModifier from "../../content-script/modifications/graphModal";

    export let graphModalModifier: GraphModalModifier;
</script>

<div class="relative h-full w-full pt-5">
    <div
        class="modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out bg-stone-800 opacity-50"
        on:click={() => graphModalModifier.closeModal()}
    />
    <div
        class="modal-content relative z-10 mx-auto h-4/6 w-4/6 rounded-lg px-2 py-2 pr-3 shadow"
    />
</div>

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .modal-content {
        background-color: var(--lindy-background-color);
    }
</style>
