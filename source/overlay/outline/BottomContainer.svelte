<script lang="ts">
    import browser from "../../common/polyfill";
    import { fade } from "svelte/transition";

    import { LibraryState } from "../../common/schema";
    import RelatedArticles from "./Library/RelatedArticles.svelte";
    import { getRandomColor } from "../../common/annotations/styling";
    import LindyIcon from "./Library/LindyIcon.svelte";
    import { reportEventContentScript } from "../../content-script/messaging";

    export let libraryState: LibraryState;

    let topicColor: string = null;
    $: topicColor = libraryState.libraryInfo?.topic?.group_id
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
        <div
            class="container-content m-[5px] rounded-lg font-paragraph text-gray-700 shadow"
            in:fade
        >
            <div
                class="relative rounded-lg p-3"
                style={`background-color: ${topicColor}`}
            >
                <RelatedArticles {libraryState} />
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
{:else}
    <!-- <div>Sign up for Unclutter Library to see related articles here.</div> -->
{/if}

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .container-content {
        background-color: var(--lindy-background-color);
        transition: background 0.3s ease-in-out 0.1s;
    }
</style>
