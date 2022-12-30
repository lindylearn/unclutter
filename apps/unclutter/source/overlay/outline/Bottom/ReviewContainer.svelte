<script lang="ts">
    import browser from "../../../common/polyfill";
    import { fade } from "svelte/transition";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";

    export let libraryModalModifier: LibraryModalModifier;
</script>

<div
    class="bottom-container font-text relative m-[5px] mt-[8px] flex flex-col gap-4 rounded-lg p-2 text-gray-800 shadow"
    in:fade
>
    <!-- <textarea
        class="h-20 select-none rounded-md bg-transparent p-1 align-top text-sm placeholder-gray-400 outline-none placeholder:select-none md:text-base"
        placeholder="Learnings..."
    /> -->
</div>

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .bottom-container.bottom-container {
        background-color: var(--lindy-background-color);
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out;

        color: rgb(31 41 55) !important;
    }
</style>
