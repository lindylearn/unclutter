<script lang="ts">
    import browser from "../../common/polyfill";
    import { fade } from "svelte/transition";

    import { LibraryState } from "../../common/schema";
    import StaticArticleList from "./Library/StaticArticleList.svelte";
    import StackedArticleList from "./Library/StackedArticleList.svelte";
    import { getRandomColor } from "../../common/annotations/styling";
    import LindyIcon from "./Library/LindyIcon.svelte";
    import { reportEventContentScript } from "../../content-script/messaging";
    import {
        dismissedLibrarySignupMessage,
        getFeatureFlag,
        setFeatureFlag,
    } from "../../common/featureFlags";
    import { createEventDispatcher } from "svelte";

    export let libraryState: LibraryState | null;

    let topicColor: string = null;
    $: topicColor = libraryState?.libraryInfo?.topic?.group_id
        ? getRandomColor(libraryState.libraryInfo?.topic?.group_id)
        : "";

    function openLibrary() {
        browser.runtime.sendMessage(null, {
            event: "openLibrary",
        });
        reportEventContentScript("openLibrary", {
            libraryUser: libraryState.libraryUser,
        });
    }

    let dismissedSignupMessage = false;
    getFeatureFlag(dismissedLibrarySignupMessage).then((dismissed) => {
        dismissedSignupMessage = dismissed;
    });
    function dismissSignupMessage() {
        dismissedSignupMessage = true;
        setFeatureFlag(dismissedLibrarySignupMessage, true);
        reportEventContentScript("dismissedLibrarySignupMessage");
    }
</script>

{#if libraryState?.libraryUser}
    {#if libraryState.relatedArticles?.length > 0}
        <!-- solid background for transparent topic color -->
        <div
            class="related-container m-[5px] rounded-lg font-paragraph text-gray-700 shadow"
            in:fade
        >
            <div
                class="relative rounded-lg p-3"
                style={`background-color: ${topicColor}`}
            >
                <StaticArticleList
                    articles={libraryState.relatedArticles}
                    libraryUser={libraryState.libraryUser}
                />
                <div
                    class="absolute top-3 right-3 flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 font-header text-sm font-semibold shadow-sm transition-all hover:scale-95 hover:shadow"
                    style={`background-color: ${topicColor}`}
                    on:click={() => openLibrary()}
                >
                    <div class="w-6"><LindyIcon /></div>
                    Open Library
                </div>

                <!-- <div class="absolute bottom-3 right-3 leading-none">
                Related articles
            </div> -->
            </div>
        </div>
    {/if}
{:else if libraryState?.showLibrarySignup && libraryState?.relatedArticles && !dismissedSignupMessage}
    <div
        class="signup-container relative m-[5px] rounded-lg bg-lindy p-4 pr-6 font-paragraph text-gray-800 shadow"
        in:fade
    >
        <div class="flex items-start gap-3">
            <a
                class="w-10 flex-shrink-0 cursor-pointer transition-transform hover:scale-95"
                href="https://library.lindylearn.io/signup"
                target="_blank"
                rel="noreferrer"
                on:click={() => reportEventContentScript("clickLibrarySignup")}
            >
                <LindyIcon />
            </a>
            <div class="flex-grow">
                <span
                    ><a
                        class="inline-block cursor-pointer font-header font-bold transition-all hover:rotate-1"
                        href="https://library.lindylearn.io/signup"
                        target="_blank"
                        rel="noreferrer"
                        on:click={() =>
                            reportEventContentScript("clickLibrarySignup")}
                    >
                        Sign up
                    </a>
                    for the
                    <a
                        class="inline-block cursor-pointer font-header font-bold transition-all hover:rotate-1"
                        href="https://library.lindylearn.io/signup"
                        target="_blank"
                        rel="noreferrer"
                        on:click={() =>
                            reportEventContentScript("clickLibrarySignup")}
                    >
                        Unclutter Library
                    </a>
                    beta to:</span
                >
                <ul class="ml-12 list-disc">
                    <li>Automatically save articles you open</li>
                    <li>Organize links using AI topic classification</li>
                    <li>Full-text-search across your entire library</li>
                    <li>See related articles below each page</li>
                </ul>
            </div>
            {#if libraryState.relatedArticles}
                <StackedArticleList
                    articles={libraryState.relatedArticles
                        .slice(0, 3)
                        .reverse()}
                    libraryUser={libraryState.libraryUser}
                />
            {/if}
        </div>
        <svg
            class="close-message absolute top-1.5 right-2 w-2.5 cursor-pointer opacity-80 transition-all hover:scale-110 hover:opacity-100"
            viewBox="0 0 320 512"
            on:click={dismissSignupMessage}
        >
            <path
                fill="currentColor"
                d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"
            />
        </svg>
    </div>
{/if}

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .related-container {
        background-color: var(--lindy-background-color);
        transition: background 0.3s ease-in-out 0.1s;
    }
</style>
