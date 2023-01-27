<script lang="ts">
    import browser from "../../../common/polyfill";
    import { fade } from "svelte/transition";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";

    export let libraryModalModifier: LibraryModalModifier;
</script>

<div
    class="bottom-container font-text relative m-[5px] mt-[8px] cursor-pointer rounded-lg bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-400 p-4 text-stone-800 shadow hover:scale-[99%]"
    style:background-image="linear-gradient(120deg, var(--tw-gradient-stops))"
    on:click={() => libraryModalModifier.showModal(undefined, true)}
    in:fade
>
    <div class="flex items-center gap-4">
        <div class="">
            <img src={browser.runtime.getURL("assets/icon.svg")} class="w-10" alt="logo" />
        </div>
        <div class="flex flex-col">
            <div class="font-title text-lg font-semibold">Give feedback</div>
            <div class="">
                How does Unclutter work for you? Tell us what to improve with 3 quick questions.
            </div>
        </div>
    </div>
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
