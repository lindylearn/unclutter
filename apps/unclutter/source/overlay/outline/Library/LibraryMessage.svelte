<script lang="ts">
    import browser from "../../../common/polyfill";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import twemojiSvelte from "../components/twemoji-svelte";
    import clsx from "clsx";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";

    import { reportEventContentScript } from "source/content-script/messaging";
    import { LibraryState } from "../../../common/schema";
    import { getRelativeTime } from "../../../common/time";
    import { updateLibraryArticle } from "../../../common/api";
    import LindyIcon from "./LindyIcon.svelte";
    import LibraryModalModifier from "../../../content-script/modifications/libraryModal";
    import ResourceStat from "./ResourceStat.svelte";

    export let libraryState: LibraryState;
    export let libraryModalModifier: LibraryModalModifier;

    // local UI state
    let topicColor: string = null;
    $: topicColor = libraryState.libraryInfo?.topic?.group_id
        ? getRandomLightColor(libraryState.libraryInfo?.topic?.group_id)
        : "";

    let isFavorite: boolean = null;
    $: isFavorite = libraryState.libraryInfo?.article.is_favorite;

    function toggleFavorite() {
        isFavorite = !isFavorite;
        updateLibraryArticle(
            libraryState.libraryInfo.article.url,
            libraryState.libraryUser,
            {
                is_favorite: isFavorite,
            }
        );
    }

    function openLibrary(open_topic: boolean = false) {
        const data = {
            event: "openLibrary",
        };
        if (open_topic) {
            data["topicId"] = libraryState.libraryInfo.topic.id;
        }

        browser.runtime.sendMessage(null, data);
        reportEventContentScript("openLibrary", {
            libraryUser: libraryState.libraryUser,
        });
    }
</script>

<div
    class="library-message relative max-w-full cursor-pointer rounded-lg text-gray-800 shadow transition-transform hover:scale-[98%]"
    on:click={() => libraryModalModifier.showModal()}
>
    <div
        class="flex justify-between gap-3 rounded-lg p-3"
        style={`background-color: ${topicColor}`}
    >
        <div
            class="main-content whitespace-nowrap text-sm"
            in:fly={{ y: 10, duration: 300, easing: cubicOut }}
        >
            <div class="top-row flex">
                {#if libraryState?.libraryInfo?.topic}
                    <div
                        class="font-title relative inline-block flex-shrink overflow-ellipsis text-base font-semibold"
                        on:click={() => openLibrary(true)}
                    >
                        <div
                            class="absolute left-0 top-0 z-0 h-full w-full dark:brightness-50"
                        />
                        <div class="relative z-10 leading-none">
                            <span
                                class="inline-block h-[1em] w-5 align-baseline drop-shadow-sm"
                                use:twemojiSvelte
                            >
                                {libraryState.libraryInfo.topic.emoji}
                            </span>
                            {libraryState.libraryInfo.topic.name}
                        </div>
                    </div>
                {/if}
            </div>

            <div class="bottom-row mt-1">
                <svg
                    class="mr-0.5 inline-block w-4 align-middle"
                    viewBox="0 0 640 512"
                    ><path
                        fill="currentColor"
                        d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                    /></svg
                >
                3+ related articles
            </div>
        </div>

        <div class="absolute top-3 right-3 flex items-start gap-2">
            <ResourceStat type="articles" value={3} />
            <ResourceStat type="highlights" value={0} />
        </div>
    </div>
</div>

<style lang="postcss">
    .library-message {
        /* background transition overrides transform otherwise */
        transition: background 0.3s ease-in-out 0.1s,
            transform 150ms cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
</style>
