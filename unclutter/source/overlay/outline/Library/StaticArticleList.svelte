<script lang="ts">
    import { fade } from "svelte/transition";

    import { LibraryArticle } from "../../../common/schema";
    import ArticlePreview from "./ArticlePreview.svelte";

    export let articles: LibraryArticle[];
    export let libraryUser: string;
</script>

<div class="relative flex gap-2 rounded-lg" in:fade>
    {#each articles as article, index}
        <ArticlePreview {article} {index} {libraryUser} />
    {/each}
</div>
