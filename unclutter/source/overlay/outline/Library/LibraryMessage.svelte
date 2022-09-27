<script lang="ts">
    import browser from "../../../common/polyfill";
    import { fly, fade } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import twemojiSvelte from "../components/twemoji-svelte";
    import clsx from "clsx";

    import { reportEventContentScript } from "source/content-script/messaging";
    import { LibraryState } from "../../../common/schema";
    import { getRelativeTime } from "../../../common/time";
    import { getRandomColor } from "../../../common/annotations/styling";
    import { updateLibraryArticle } from "../../../common/api";
    import LindyIcon from "./LindyIcon.svelte";
    // import LibraryDropdown from "./LibraryDropdown.svelte";
    // import LoadingAnimation from "./LoadingAnimation.svelte";

    export let libraryState: LibraryState;

    // local UI state
    let topicColor: string = null;
    $: topicColor = libraryState.libraryInfo?.topic?.group_id
        ? getRandomColor(libraryState.libraryInfo?.topic?.group_id)
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

<div class="library-message relative max-w-full rounded-lg shadow">
    <div
        class="flex items-center gap-2 rounded-lg p-2"
        style={`background-color: ${topicColor}`}
    >
        <div
            class="w-8 flex-shrink-0 cursor-pointer transition-transform hover:scale-95"
            on:click={() => openLibrary()}
        >
            <LindyIcon />
        </div>

        <div class="h-10 flex-shrink flex-grow overflow-hidden text-sm">
            {#if libraryState.libraryInfo}
                <div
                    class="mr-6 overflow-hidden whitespace-nowrap"
                    in:fly={{ y: 10, duration: 300, easing: cubicOut }}
                >
                    <div class="flex">
                        {#if libraryState.libraryInfo.topic}
                            <span>Saved in</span>
                            <div
                                class="relative ml-1 inline-block flex-shrink cursor-pointer overflow-hidden overflow-ellipsis rounded-lg px-1 align-middle font-header text-sm font-semibold shadow-sm transition-all hover:scale-95 hover:shadow"
                                on:click={() => openLibrary(true)}
                            >
                                <div
                                    class="absolute left-0 top-0 z-0 h-full w-full dark:brightness-50"
                                    style={`background-color: ${topicColor}`}
                                />
                                <div class="relative z-10">
                                    <span
                                        class="inline-block w-5 align-top drop-shadow-sm"
                                        use:twemojiSvelte
                                    >
                                        {libraryState.libraryInfo.topic.emoji}
                                    </span>
                                    {libraryState.libraryInfo.topic.name}
                                </div>
                            </div>
                        {:else}
                            <span>Saved in your Library.</span>
                        {/if}
                    </div>

                    {#if libraryState.wasAlreadyPresent && libraryState.libraryInfo.article.time_added}
                        Added {getRelativeTime(
                            libraryState.libraryInfo.article.time_added * 1000
                        )}.
                    {:else if libraryState.relatedArticles?.length > 0}
                        <span in:fade
                            >Found {libraryState.relatedArticles.length} related
                            article{libraryState.relatedArticles.length
                                ? "s"
                                : ""}.</span
                        >
                    {/if}
                </div>

                <!-- <LibraryDropdown /> -->
                <div
                    class={"star-icon absolute top-2 right-2 drop-shadow-sm cursor-pointer"}
                    on:click={toggleFavorite}
                >
                    <svg
                        viewBox="0 0 576 512"
                        class={clsx(
                            "absolute top-0 right-0 w-[18px] transition-all hover:scale-95",
                            isFavorite ? "opacity-1" : "opacity-0"
                        )}
                    >
                        <path
                            fill="currentColor"
                            d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
                        />
                    </svg>
                    <svg
                        viewBox="0 0 576 512"
                        class={clsx(
                            "absolute top-0 right-0 w-[18px] transition-all hover:scale-95",
                            !isFavorite ? "opacity-1" : "opacity-0"
                        )}
                    >
                        <path
                            fill="currentColor"
                            d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"
                        />
                    </svg>
                </div>
            {:else if libraryState.error}
                Error adding article :(
            {:else if libraryState.isClustering}
                <div
                    class="flex h-full flex-grow justify-between"
                    in:fly={{ y: 10, duration: 300, easing: cubicOut }}
                >
                    <div>Adding to your library...</div>
                    <!-- <LoadingAnimation class="self-center" /> -->
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="postcss" global>
</style>
