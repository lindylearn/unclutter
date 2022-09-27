<script lang="ts">
    import { fade } from "svelte/transition";

    import { Article } from "@unclutter/library-components/dist/store/_schema";
    import ArticlePreview from "./ArticlePreview.svelte";

    export let articles: Article[];
    export let libraryUser: string;

    const articleScale = 0.65;
    const articleOverlay = 0.7;
</script>

<div
    class="relative flex-shrink-0"
    style:height={`${208 * articleScale}px`}
    style:width={`${
        176 * articleScale * (1 + (articles.length - 1) * articleOverlay)
    }px`}
    in:fade
>
    {#each articles as article, index}
        <ArticlePreview
            {article}
            {index}
            {libraryUser}
            className="absolute origin-top-left"
            transform={`scale(${articleScale}) translate(${
                articleOverlay * 100 * index
            }%, 0) rotate(${index % 2 === 0 ? -2 : 2}deg)`}
        />
    {/each}
</div>
