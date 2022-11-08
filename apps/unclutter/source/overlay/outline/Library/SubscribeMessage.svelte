<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";

    import { LibraryState } from "../../../common/schema";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";

    export let libraryState: LibraryState;
    export let libraryModalModifier: LibraryModalModifier;
    export let darkModeEnabled: boolean;
</script>

<div
    class="library-message relative flex max-w-full cursor-pointer items-center justify-between gap-5 rounded-lg text-gray-800 shadow transition-transform hover:scale-[98%]"
>
    <div class="content h-[calc(1rem+0.5rem+1.25rem+0.75rem*2)] whitespace-nowrap p-3 px-4 text-sm">
        {#if libraryState.feed}
            <div
                class="top-row font-title flex whitespace-pre text-base font-semibold leading-none"
                in:fly={{ y: 10, duration: 300, easing: cubicOut }}
            >
                Follow <span class="hide-tiny">{libraryState.feed.articleFeed.domain}</span>
            </div>
        {/if}

        {#if libraryState.feed?.articleFeed.post_frequency}
            <div
                class={clsx(
                    "bottom-row mt-1 flex items-center gap-1",
                    !libraryState.libraryInfo?.topic && "text-gray-400 dark:text-stone-600"
                )}
                in:fly={{ y: 10, duration: 200, easing: cubicOut }}
            >
                about {libraryState.feed?.articleFeed.post_frequency}
            </div>
        {/if}
    </div>

    <div
        class="toggle transition-color h-[calc(1rem+0.5rem+1.25rem+0.75rem*2)] shrink-0 rounded-r-lg p-3 px-4"
        style={`background-color: ${getRandomLightColor(libraryState.feed?.articleFeed.domain)}`}
    >
        <svg class="w-6 " viewBox="0 0 448 512"
            ><path
                fill="currentColor"
                d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
            /></svg
        >
    </div>
</div>

<style lang="postcss">
    .library-message {
        /* background transition overrides transform otherwise */
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out !important;
    }

    @media (max-width: 230px) {
        .hide-tiny {
            display: none;
        }
    }
</style>
