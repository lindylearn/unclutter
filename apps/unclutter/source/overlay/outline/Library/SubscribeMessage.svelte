<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import clsx from "clsx";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";

    import { LibraryState } from "../../../common/schema";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";
    import LibraryModifier from "../../../content-script/modifications/library";

    export let libraryState: LibraryState;
    export let libraryModifier: LibraryModifier;
    export let libraryModalModifier: LibraryModalModifier;
    export let darkModeEnabled: boolean;
</script>

<div
    class="library-message relative flex max-w-full cursor-pointer items-center justify-between gap-2 rounded-lg text-gray-800 shadow transition-transform hover:scale-[98%]"
>
    <div
        class="content flex h-[calc(1rem+0.5rem+1.25rem+0.75rem*2)] flex-col overflow-hidden whitespace-nowrap py-3 pl-4 text-sm"
        in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        on:click={() => libraryModalModifier.showModal()}
    >
        {#if libraryState.feed}
            <div
                class="top-row font-title overflow-hidden overflow-ellipsis whitespace-pre text-base font-semibold leading-none"
            >
                <!-- <span class="hide-tiny"
                    >{libraryState.feed.isSubscribed ? "Following" : "Follow"}</span
                > -->
                {libraryState.feed.articleFeed.title || libraryState.feed.articleFeed.domain}
            </div>
        {/if}

        {#if libraryState.feed?.articleFeed.post_frequency}
            <div
                class="bottom-row mt-1 overflow-hidden overflow-ellipsis whitespace-pre text-gray-400 dark:text-stone-600"
            >
                <span class="hide-tiny">about</span>
                {libraryState.feed.articleFeed.post_frequency}
            </div>
        {/if}
    </div>

    <!-- style={`background-color: ${getRandomLightColor(libraryState.feed?.articleFeed?.domain)}`} -->
    <div
        class="toggle transition-color flex h-[calc(1rem+0.5rem+1.25rem+0.75rem*2)] shrink-0 items-center rounded-r-lg bg-stone-50 py-3 px-4 dark:bg-stone-800"
        on:click={() => libraryModifier.toggleFeedSubscribed()}
    >
        {#if libraryState.feed?.isSubscribed}
            <svg class="w-6" viewBox="0 0 448 512"
                ><path
                    fill="currentColor"
                    d="M440.1 103C450.3 112.4 450.3 127.6 440.1 136.1L176.1 400.1C167.6 410.3 152.4 410.3 143 400.1L7.029 264.1C-2.343 255.6-2.343 240.4 7.029 231C16.4 221.7 31.6 221.7 40.97 231L160 350.1L407 103C416.4 93.66 431.6 93.66 440.1 103V103z"
                /></svg
            >
        {:else}
            <svg class="w-6" viewBox="0 0 448 512"
                ><path
                    fill="currentColor"
                    d="M432 256C432 269.3 421.3 280 408 280h-160v160c0 13.25-10.75 24.01-24 24.01S200 453.3 200 440v-160h-160c-13.25 0-24-10.74-24-23.99C16 242.8 26.75 232 40 232h160v-160c0-13.25 10.75-23.99 24-23.99S248 58.75 248 72v160h160C421.3 232 432 242.8 432 256z"
                /></svg
            >
        {/if}
    </div>
</div>

<style lang="postcss">
    .library-message {
        /* background transition overrides transform otherwise */
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out !important;
    }

    @media (max-width: 250px) {
        .hide-tiny {
            display: none;
        }
    }
</style>
