<script lang="ts">
    import browser from "../../common/polyfill";
    import { fade } from "svelte/transition";
    import {
        dismissedLibrarySignupMessage,
        getFeatureFlag,
        setFeatureFlag,
    } from "../../common/featureFlags";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common";
    import LibraryModalModifier from "../../content-script/modifications/libraryModal";

    export let libraryModalModifier: LibraryModalModifier;

    let dismissedSignupMessage = null;
    getFeatureFlag(dismissedLibrarySignupMessage).then((dismissed) => {
        dismissedSignupMessage = dismissed || false;
    });
    function dismissSignupMessage() {
        dismissedSignupMessage = true;
        setFeatureFlag(dismissedLibrarySignupMessage, true);
        reportEventContentScript("dismissedLibrarySignupMessage");
    }
</script>

<div
    class="bottom-container font-text relative m-[5px] mt-[8px] cursor-pointer rounded-lg bg-white p-4 text-stone-800 shadow hover:scale-[99%]"
    on:click={() => libraryModalModifier.showModal(undefined, true)}
    in:fade
>
    <div class="flex gap-4">
        <div class="">
            <img src={browser.runtime.getURL("assets/icon.svg")} class="w-10" alt="logo" />
        </div>
        <div class="flex flex-col gap-1">
            <div class="font-title text-xl font-semibold">Give feedback</div>
            <div>
                How well does Unclutter work for you? Tell us what to improve with 3 quick
                questions.
            </div>
        </div>
    </div>
</div>

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .bottom-container {
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out !important;
    }
</style>
