<script lang="ts">
    import type { RelatedHighlight } from "../../content-script/modifications/DOM/smartHighlights";
    import ArticlePreview from "../outline/Library/ArticlePreview.svelte";

    export let quote: string;
    export let related: RelatedHighlight[];
</script>

{#if related && related.length > 0}
    <div
        class="font-text highlighter mt-2 flex max-w-lg flex-col gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-1.5 text-sm text-stone-900 shadow-xl drop-shadow"
    >
        {#each related.slice(0, 3) as highlight}
            <div class="flex cursor-pointer items-center gap-2 overflow-hidden">
                <!-- <ArticlePreview
                    index={0}
                    article={{
                        url: "http://paulgraham.com/vb.html",
                        title: highlight.title,
                        reading_progress: 0,
                    }}
                    className="shrink-0 w-[100px] h-[120px] transition-transform relative"
                    transform="rotate(1deg) scale(1.1)"
                /> -->
                <div
                    class="flex flex-col gap-2 overflow-hidden rounded-lg bg-stone-100 p-2 shadow-sm"
                >
                    <div
                        class="overflow-hidden overflow-ellipsis"
                        style:display="-webkit-box"
                        style:-webkit-box-orient="vertical"
                        style:-webkit-line-clamp="4"
                    >
                        {highlight.score.toFixed(2)}
                        "{highlight.text}"
                    </div>
                    <div
                        class="font-title flex items-center justify-between gap-2 overflow-hidden rounded-b-lg"
                    >
                        <div
                            class="flex-shrink overflow-hidden overflow-ellipsis whitespace-nowrap"
                        >
                            {highlight.title}
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}

<style lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .highlighter {
        animation: highlighterFadeIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1); /* easeOutBack */
        animation-fill-mode: both;
        background: white !important; /* prevent site override */
    }

    @keyframes highlighterFadeIn {
        from {
            transform: scale(0.95) translateY(10px);
        }
        to {
            transform: scale(1) translateY(0);
        }
    }

    .tag:hover > .name {
        background-color: var(--active-color);
    }
</style>
