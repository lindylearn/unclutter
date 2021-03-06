<script lang="ts">
    import browser from "../../common/polyfill";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    // import twemoji from "twemoji";
    import twemojiSvelte from "./twemoji-svelte";

    import { reportEventContentScript } from "source/content-script/messaging";
    import { LibraryInfo } from "../../common/schema";
    import {
        addArticleToLibrary,
        checkArticleInLibrary,
    } from "../../common/api";
    import { getRelativeTime } from "../../common/time";
    import { getRandomColor } from "../../common/annotations/styling";

    export let articleUrl: string;
    export let libraryUser: string;

    let libraryInfo: LibraryInfo = null;
    let topicColor: string = null;
    let wasAlreadyPresent = null;
    (async () => {
        libraryInfo = await checkArticleInLibrary(articleUrl, libraryUser);
        if (!libraryInfo) {
            libraryInfo = await addArticleToLibrary(articleUrl, libraryUser);
        } else {
            wasAlreadyPresent = true;
        }

        topicColor = getRandomColor(libraryInfo.topic?.parent_topic_id);
    })();

    function openLibrary() {
        browser.runtime.sendMessage(null, {
            event: "openLibrary",
        });
    }
    function openLibraryTopic() {
        browser.runtime.sendMessage(null, {
            event: "openLibrary",
            topicId: libraryInfo.topic.id,
        });
    }
</script>

<div
    class="library-message relative max-w-full rounded-lg px-2 py-2 text-gray-800 shadow"
>
    <div class="flex gap-2">
        <svg
            class="w-8 flex-shrink-0 cursor-pointer"
            viewBox="0 0 512 512"
            on:click={openLibrary}
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

        <div class="flex-shrink overflow-hidden text-sm">
            {#if libraryInfo}
                <div
                    class="overflow-hidden whitespace-nowrap"
                    transition:fly={{ y: 10, duration: 200, easing: quintOut }}
                >
                    <div class="flex">
                        {#if libraryInfo.topic}
                            <span>Saved in</span>
                            <div
                                class="ml-1 flex-shrink cursor-pointer overflow-hidden overflow-ellipsis rounded-lg px-1 align-top text-sm shadow-sm transition-all hover:scale-95 hover:shadow dark:text-stone-200 dark:hover:shadow-2xl"
                                style={`background-color: ${topicColor}`}
                                on:click={openLibraryTopic}
                            >
                                <span
                                    class="inline-block w-5 align-top drop-shadow-sm"
                                    use:twemojiSvelte
                                >
                                    {libraryInfo.topic.emoji}
                                </span>

                                {libraryInfo.topic.name}
                            </div>
                        {:else}
                            <span>Saved in your Library.</span>
                        {/if}
                    </div>

                    {#if wasAlreadyPresent}
                        First read {getRelativeTime(
                            libraryInfo.article.time_added * 1000
                        )}.
                    {:else}
                        Found {libraryInfo.sibling_count} related article{libraryInfo.sibling_count !==
                        1
                            ? "s"
                            : ""}.
                    {/if}
                </div>
            {:else}
                <!-- Loading... -->

                <!-- use same height -->
                {"Loading... "}
                <br />
                {" "}
            {/if}
        </div>
    </div>
</div>

<style lang="postcss">
    .library-message {
        background-color: #edd75b !important;
    }
</style>
