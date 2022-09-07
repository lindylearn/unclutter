<script lang="ts">
    import browser from "../../common/polyfill";
    import { fade } from "svelte/transition";

    import { LibraryArticle, LibraryState } from "../../common/schema";
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

    export let libraryState: LibraryState | null = null;
    export let linkedArticles: LibraryArticle[] | null = null;

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

{#if true || libraryState?.libraryUser}
    {#if linkedArticles?.length > 0}
        <!-- solid background for transparent topic color -->
        <div
            class="related-container m-[5px] font-paragraph text-gray-700"
            in:fade
        >
            <div class="mt-2 mb-2 text-sm tabular-nums text-gray-400">
                <svg class="inline-block w-4" viewBox="0 0 640 512"
                    ><path
                        fill="currentColor"
                        d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                    /></svg
                >
                Linked articles
            </div>

            <StaticArticleList
                articles={linkedArticles.slice(0, 5)}
                libraryUser={libraryState.libraryUser}
            />

            <!-- <div
                    class="absolute top-3 right-3 flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-0.5 font-header text-sm font-semibold shadow-sm transition-all hover:scale-95 hover:shadow"
                    style={`background-color: ${topicColor}`}
                    on:click={() => openLibrary()}
                >
                    <div class="w-6"><LindyIcon /></div>
                    Open Library
                </div> -->
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
    }
</style>
