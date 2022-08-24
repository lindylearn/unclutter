<script lang="ts">
    import { fade } from "svelte/transition";

    import { LibraryState } from "../../../common/schema";
    import ArticlePreview from "./ArticlePreview.svelte";

    export let libraryState: LibraryState;
</script>

<div>
    <!-- <h2 class="mb-3">Related from your library:</h2> -->
    <div class="relative flex gap-2 rounded-lg" in:fade>
        {#each libraryState.relatedArticles as article, index}
            <ArticlePreview {article} {index} />
        {/each}
    </div>
</div>
