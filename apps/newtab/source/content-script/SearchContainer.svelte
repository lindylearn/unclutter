<script lang="ts">
    import { fade } from "svelte/transition";
    import { SearchResult as SearchResultType } from "@unclutter/library-components/dist/common";

    import browser from "../common/polyfill";
    import ArticlePreview from "./ArticlePreview.svelte";
    import LindyIcon from "./LindyIcon.svelte";
    import SearchResult from "./SearchResult.svelte";
    import { reportEventContentScript } from "../common/messaging";

    export let query: string;
    export let searchResults: SearchResultType[] | null;

    function openLibrary() {
        browser.runtime.sendMessage({ event: "openLibrary" });
        reportEventContentScript("openLibraryFromSearch");
    }

    let reportedMetric = false;
    $: {
        if (searchResults && searchResults.length > 0 && !reportedMetric) {
            reportEventContentScript("seeLibrarySearchResults", {
                count: searchResults.length,
            });
            reportedMetric = true;
        }
    }
</script>

{#if searchResults && searchResults.length > 0}
    <div id="unclutter-search-content" in:fade>
        <div id="unclutter-header">
            <span>From your Unclutter Library</span>
            <div id="library-icon" on:click={openLibrary}>
                <LindyIcon />
            </div>
        </div>
        <div id="search-results">
            {#each searchResults as searchResult}
                <SearchResult {query} {searchResult} />
            {/each}
        </div>
    </div>
{/if}

<style lang="postcss">
    /* tailwind normalize messes with default styles */

    #unclutter-search-content {
        /* default Google style */
        border: 1px solid #dadce0;
        border-radius: 8px;

        font-family: arial, sans-serif;

        overflow: hidden;
    }

    #unclutter-header {
        padding: 12px 16px;
        border-bottom: 1px solid #dadce0;
        background: rgba(237 215 91 / 80%);

        display: flex;
        justify-content: space-between;

        font-family: Google Sans, arial, sans-serif;
        font-weight: 400;
        font-size: 18px;
        line-height: 24px;
        color: #202124;
    }
    #library-icon {
        height: 0;
        transform: scale(1.2);
        margin-top: -4px;
        cursor: pointer;
        transition: transform cubic-bezier(0.4, 0, 0.2, 1) 150ms;
    }
    #library-icon:hover {
        transform: scale(1.3);
    }

    #search-results {
        display: flex;
        flex-direction: column;
        overflow-x: hidden;
        overflow-y: scroll;
        max-height: 320px;
    }

    @media (prefers-color-scheme: dark) {
        #unclutter-search-content {
            border-color: #3c4043;
        }
        #unclutter-header {
            background: hsl(51, 80%, 43%);
            border-color: #3c4043;
        }
    }
    @media (min-width: 1364px) {
        #unclutter-search-content {
            width: 457px;
        }
    }
</style>
