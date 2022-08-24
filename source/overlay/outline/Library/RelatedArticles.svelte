<script lang="ts">
    import { fade } from "svelte/transition";

    import { LibraryState } from "../../../common/schema";
    import ArticlePreview from "./ArticlePreview.svelte";

    export let libraryState: LibraryState;
</script>

<div
    class="relative flex h-28 max-w-full items-center gap-3 rounded-lg px-2 py-2 shadow"
    in:fade
>
    {#each libraryState.relatedArticles.slice(0, 3) as article, index}
        <ArticlePreview {article} {index} />
    {/each}
</div>
