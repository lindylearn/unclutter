<script lang="ts">
    import browser from "../../common/polyfill";
    import { fade } from "svelte/transition";
    import LibraryModalModifier from "../../content-script/modifications/libraryModal";

    export let libraryModalModifier: LibraryModalModifier;
</script>

<div
    class="bottom-container font-text relative m-[5px] mt-[8px] cursor-pointer rounded-lg bg-white p-4 text-gray-800 shadow hover:scale-[99%]"
    on:click={() => libraryModalModifier.showModal(undefined, true)}
    in:fade
>
    <div class="flex gap-4 items-center">
        <div class="">
            <img src={browser.runtime.getURL("assets/icon.svg")} class="w-10" alt="logo" />
        </div>
        <div class="flex flex-col">
            <div class="font-title text-lg font-semibold">Give feedback</div>
            <div class="">
                How well does Unclutter work for you? Tell us what to improve with 3 quick questions.
            </div>
        </div>
    </div>
</div>

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .bottom-container {
        background-color: var(--lindy-background-color);
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out;
    }
</style>
