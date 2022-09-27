<script lang="ts">
    import {
        openArticle,
        SearchResult,
    } from "@unclutter/library-components/dist/common";
    import { reportEventContentScript } from "../common/messaging";
    import { highlightExactMatch } from "../common/util";
    import ArticlePreview from "./ArticlePreview.svelte";

    export let query: string;
    export let searchResult: SearchResult;

    const title = highlightExactMatch(searchResult.article.title || "", query);
    const paragraph = highlightExactMatch(
        searchResult.sentences[searchResult.main_sentence || 0] || "",
        query
    );

    function open(e) {
        e.preventDefault();
        e.stopPropagation();

        openArticle(searchResult.article.url);
        reportEventContentScript("clickLibrarySearchResult");
    }
</script>

<a id="unclutter-search-item" href={searchResult.article.url} on:click={open}>
    <ArticlePreview article={searchResult.article} />
    <div style:overflow="hidden">
        <div id="item-title">
            {@html title}
        </div>
        <div id="item-paragraph">
            {@html paragraph}
        </div>
    </div>
</a>

<style global>
    #unclutter-search-item {
        padding: 8px 12px;
        /* border-top: 1px solid #dadce0; */
        cursor: pointer;
        transition: all cubic-bezier(0.4, 0, 0.2, 1) 150ms;
        text-decoration: none !important;

        display: flex;
        gap: 12px;
    }
    #unclutter-search-item:hover {
        background: #f1f3f4;
    }
    #unclutter-search-item:first-child {
        padding-top: 12px;
        border-top: none;
    }
    #unclutter-search-item:last-child {
        padding-bottom: 12px;
    }

    #item-title {
        font-family: Google Sans, arial, sans-serif;
        font-size: 16px;
        font-weight: 400;
        line-height: 20px;
        color: #202124;

        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;

        margin-bottom: 2px;
    }
    #item-paragraph {
        color: #70757a;
        font-size: 14px;
        line-height: 1.43;

        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
    }
    match {
        font-family: arial, sans-serif;
        font-weight: 700;
        color: #202124;
    }

    @media (prefers-color-scheme: dark) {
        #unclutter-search-item {
            border-color: #3c4043;
        }
        #unclutter-search-item:hover {
            background: #303134;
        }
        #item-title {
            color: #e8eaed;
        }
        #item-paragraph {
            color: #9aa0a6;
        }
        match {
            color: #e8eaed;
        }
    }
</style>
