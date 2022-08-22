<script lang="ts">
    import browser from "../../../common/polyfill";
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import twemojiSvelte from "../twemoji-svelte";
    import clsx from "clsx";

    import { reportEventContentScript } from "source/content-script/messaging";
    import { LibraryState } from "../../../common/schema";
    import { getRelativeTime } from "../../../common/time";
    import { getRandomColor } from "../../../common/annotations/styling";
    import { updateLibraryArticle } from "../../../common/api";
    // import LibraryDropdown from "./LibraryDropdown.svelte";
    // import LoadingAnimation from "./LoadingAnimation.svelte";

    export let libraryState: LibraryState;

    // local UI state
    let topicColor: string = null;
    $: topicColor = libraryState.libraryInfo?.topic?.group_id
        ? getRandomColor(libraryState.libraryInfo?.topic?.group_id)
        : "white";

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
    class="library-message relative max-w-full rounded-lg px-2 py-2 shadow"
    style={`background-color: ${topicColor}`}
>
    <div class="flex gap-2">
        <svg
            class="w-8 flex-shrink-0 cursor-pointer"
            viewBox="0 0 512 512"
            on:click={() => openLibrary()}
        >
            <path
                fill="currentColor"
                d="M322.92,363.59a16.27,16.27,0,0,0-10.77-8.46l-.17,0c-23.11-6.31-45.14-9.5-65.49-9.5-44.82,0-72.15,15.56-84.45,24.84a32.81,32.81,0,0,1-19.91,6.68,33.32,33.32,0,0,1-29.87-18.77L46.67,221.94a7.44,7.44,0,0,0-11.58-2.39l-.17.14a16.48,16.48,0,0,0-4,19.61l94.43,195.75a16.25,16.25,0,0,0,26.79,3.69c56.59-63.15,138.33-60.33,168.87-56.83a6.46,6.46,0,0,0,6.5-9.34Z"
                id="path835"
            />
            <path
                fill="currentColor"
                d="M475.18,278.79A7.44,7.44,0,0,0,481.37,267l-10.46-14.69a6.51,6.51,0,0,0-8.79-1.77,32.06,32.06,0,0,1-11.42,4.63c-31.45,6.08-60.35,22.79-85.91,49.66-19.72,20.74-29.87,40-29.94,40.16l0,0a4.63,4.63,0,0,0-.08,4.24l7.7,15.21a7.13,7.13,0,0,0,11.86,1.32c15.72-19,48.92-44.35,114.58-45.06a10,10,0,0,0,8.36-15.3l-15.83-25.17S465.41,278.6,475.18,278.79Z"
                id="path837"
            />
            <path
                fill="currentColor"
                d="M302.84,323.94l-91.68-181a10.29,10.29,0,0,0-7-5.41c-28.58-6.21-90.13-10.64-144.4,45.71a13.33,13.33,0,0,0-2.44,15l72.86,151.5a13.26,13.26,0,0,0,19.94,4.85c20.47-15.44,67.41-39.75,147.22-23.39A5.07,5.07,0,0,0,302.84,323.94ZM119.08,185.38c1.36-1,33.75-25.12,73.77-13.24A8.51,8.51,0,1,1,188,188.45c-31.85-9.46-58.39,10.29-58.65,10.49a8.51,8.51,0,0,1-10.28-13.56Zm11.1,67.48a8.51,8.51,0,0,1-11.93-12.13c1.56-1.53,38.91-37.45,95.87-23.15a8.51,8.51,0,1,1-4.15,16.5C162.18,222.08,130.5,252.56,130.18,252.86ZM245.4,278.31a8.52,8.52,0,0,1-10.22,6.36c-39.57-9.23-65.79,9.09-66.05,9.28a8.51,8.51,0,0,1-9.9-13.85c1.32-.94,32.83-22.94,79.81-12A8.52,8.52,0,0,1,245.4,278.31Z"
                id="path839"
            />
            <path
                fill="currentColor"
                d="M455.27,216.94,373.61,78.82A22.12,22.12,0,0,0,355.66,68c-24.58-1.22-81.18,3.17-126,61a10.24,10.24,0,0,0-1,10.89l90.41,178.51a5.06,5.06,0,0,0,8.68.59c17.6-25.31,57.22-71.26,119.17-83.24A12.59,12.59,0,0,0,455.27,216.94ZM288.44,163a8.51,8.51,0,1,1-13.2-10.74c.75-.91,18.56-22.57,43.07-31.1a8.5,8.5,0,0,1,5.6,16.06C303.91,144.15,288.59,162.77,288.44,163Zm13.1,43.4A8.53,8.53,0,0,1,295.25,193c.95-1.34,23.73-33,60-40.66a8.51,8.51,0,0,1,3.52,16.65c-29.86,6.32-49.47,33.58-49.66,33.85A8.52,8.52,0,0,1,301.54,206.36Zm90.79,5.12c-45.32,1.69-59.23,36.18-59.8,37.64a8.52,8.52,0,0,1-8.14,5.45,8.39,8.39,0,0,1-2.84-.56,8.49,8.49,0,0,1-4.93-10.92c.72-1.9,18.16-46.49,75.07-48.61a8.51,8.51,0,1,1,.64,17Z"
                id="path841"
            />
        </svg>

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
                                class="relative ml-1 inline-block flex-shrink cursor-pointer overflow-hidden overflow-ellipsis rounded-lg px-1 align-middle text-sm shadow-sm transition-all hover:scale-95 hover:shadow"
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
                    {:else if libraryState.libraryInfo.sibling_count > 0}
                        Found {libraryState.libraryInfo.sibling_count} related article{libraryState
                            .libraryInfo.sibling_count !== 1
                            ? "s"
                            : ""}.
                    {/if}
                </div>

                <!-- <LibraryDropdown /> -->
                <div
                    class={"absolute top-2 right-2 drop-shadow-sm cursor-pointer"}
                    on:click={toggleFavorite}
                >
                    <svg
                        viewBox="0 0 576 512"
                        class={clsx(
                            "absolute top-0 right-0 w-[18px] transition-all",
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
                            "absolute top-0 right-0 w-[18px] transition-all",
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
