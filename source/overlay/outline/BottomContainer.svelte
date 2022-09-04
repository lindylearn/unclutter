<script lang="ts">
    import browser from "../../common/polyfill";
    import { fade } from "svelte/transition";

    import { LibraryState } from "../../common/schema";
    import StaticArticleList from "./Library/StaticArticleList.svelte";
    import StackedArticleList from "./Library/StackedArticleList.svelte";
    import { getRandomColor } from "../../common/annotations/styling";
    import LindyIcon from "./Library/LindyIcon.svelte";
    import { reportEventContentScript } from "../../content-script/messaging";

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
{:else if libraryState?.showLibrarySignup && libraryState?.relatedArticles}
    <div
        class="signup-container m-[5px] rounded-lg bg-lindy p-4 font-paragraph text-gray-800 shadow"
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
                    <li>See related articles in place of this message</li>
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
