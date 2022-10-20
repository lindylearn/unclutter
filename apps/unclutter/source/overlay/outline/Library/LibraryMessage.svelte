<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import twemojiSvelte from "../components/twemoji-svelte";
    import clsx from "clsx";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";

    import { LibraryState } from "../../../common/schema";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";
    import ResourceStat from "./ResourceStat.svelte";
    import { getRelativeTime } from "@unclutter/library-components/dist/common";

    export let libraryState: LibraryState;
    export let libraryModalModifier: LibraryModalModifier;
    export let darkModeEnabled: boolean;

    // local UI state
    let topicColor: string = null;
    $: topicColor =
        (libraryState.userInfo?.onPaidPlan || libraryState.userInfo?.trialEnabled) &&
        libraryState.libraryInfo?.topic?.id
            ? getRandomLightColor(libraryState.libraryInfo.topic.id, darkModeEnabled)
            : "";
</script>

<div
    class="library-message relative max-w-full cursor-pointer rounded-lg text-gray-800 shadow transition-transform hover:scale-[98%]"
    on:click={() => libraryModalModifier.showModal()}
>
    <div
        class="flex h-[calc(1rem+0.5rem+1.25rem+0.75rem*2)] justify-between gap-3 rounded-lg p-3 transition-colors"
        style={`background-color: ${topicColor}`}
    >
        <div class="main-content whitespace-nowrap text-sm">
            {#if libraryState?.libraryInfo?.topic}
                <div class="top-row flex" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
                    <div
                        class="font-title relative z-10 flex flex-shrink gap-2 overflow-ellipsis text-base font-semibold leading-none"
                    >
                        <div class="flex h-[1em] items-center">
                            {#if libraryState.libraryInfo.topic.emoji}
                                <div class="w-5 drop-shadow-sm" use:twemojiSvelte>
                                    {libraryState.libraryInfo.topic.emoji}
                                </div>
                            {/if}
                        </div>
                        <div>{libraryState.libraryInfo.topic.name}</div>
                    </div>
                </div>
            {:else if libraryState.isClustering}
                <div class="top-row flex" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
                    Adding to your library...
                </div>
            {:else if libraryState.error}
                <div class="top-row flex" in:fly={{ y: 10, duration: 300, easing: cubicOut }}>
                    Error adding article :(
                </div>
            {:else}
                <div
                    class="top-row font-title flex whitespace-pre text-base font-semibold leading-none"
                    in:fly={{ y: 10, duration: 300, easing: cubicOut }}
                >
                    Saved in <span class="hide-small">your </span>library
                </div>
            {/if}

            {#if !(libraryState.userInfo?.onPaidPlan || libraryState.userInfo?.trialEnabled) && libraryState.libraryInfo.article}
                <div
                    class="bottom-row mt-2 flex items-center gap-1"
                    in:fly={{ y: 10, duration: 200, easing: cubicOut }}
                >
                    <!-- <svg class="h-4 w-4" viewBox="0 0 448 512"
                ><path
                    fill="currentColor"
                    d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                /></svg
            > -->
                    Added {getRelativeTime(libraryState.libraryInfo.article.time_added * 1000)}.
                </div>
            {:else if libraryState?.linkCount}
                <div
                    class="bottom-row mt-2 ml-0.5"
                    in:fly={{ y: 10, duration: 200, easing: cubicOut }}
                >
                    <svg class="mr-0.5 inline-block w-4 align-middle" viewBox="0 0 640 512"
                        ><path
                            fill="currentColor"
                            d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                        /></svg
                    >
                    {libraryState.linkCount} + related article{libraryState.linkCount !== 1
                        ? "s"
                        : ""}
                </div>
            {/if}
        </div>

        {#if libraryState?.readingProgress}
            <div class="absolute top-0 right-0 flex items-start gap-2 overflow-hidden p-3" in:fade>
                <ResourceStat
                    type="articles_completed"
                    value={libraryState.readingProgress.completedCount}
                    diff={libraryState.justCompletedArticle ? 1 : null}
                />
                <ResourceStat
                    type="articles"
                    value={libraryState.readingProgress.articleCount -
                        libraryState.readingProgress.completedCount}
                    diff={libraryState.wasAlreadyPresent && !libraryState.justCompletedArticle
                        ? null
                        : !libraryState.wasAlreadyPresent && libraryState.justCompletedArticle
                        ? -1
                        : (!libraryState.wasAlreadyPresent ? 1 : 0) +
                          (libraryState.justCompletedArticle ? -1 : 0)}
                />
            </div>
        {/if}
    </div>
</div>

<style lang="postcss">
    .library-message {
        /* background transition overrides transform otherwise */
        transition: background 0.3s ease-in-out 0.1s, transform 0.2s ease-in-out !important;
    }

    @media (max-width: 300px) {
        .hide-small {
            display: none;
        }
    }
</style>
