<script lang="ts">
    import { LibraryState } from "../../common/schema";
    import RelatedArticles from "./Library/RelatedArticles.svelte";

    export let libraryState: LibraryState;
</script>

<div class="text-center font-paragraph">
    {#if libraryState?.libraryUser}
        <RelatedArticles {libraryState} />
    {:else}
        <!-- <div>Sign up for Unclutter Library to see related articles here.</div> -->
    {/if}
</div>

<style global lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
