<script lang="ts">
    import type { RelatedHighlight } from "../../content-script/modifications/DOM/smartHighlights";
    import ArticlePreview from "../outline/Library/ArticlePreview.svelte";

    export let quote: string;
    export let related: RelatedHighlight[];

    // async function getTags(quote: string): Promise<string[]> {
    //     return await ky
    //         .post("https://assistant-two.vercel.app/api/tag", {
    //             json: {
    //                 text: quote,
    //             },
    //         })
    //         .json();
    // }
    // let tags = getTags(quote);

    // async function getRelatedHighlights(quote: string): Promise<any[]> {
    //     const highlights: any[] = await ky
    //         .post("https://assistant-two.vercel.app/api/query", {
    //             json: {
    //                 query: quote,
    //             },
    //         })
    //         .json();

    //     return highlights.filter((h) => h.score >= 0.5).slice(0, 3);
    // }
    // let isExpanded = true;
    // let relatedHighlights = null;
    // $: if (isExpanded) {
    //     relatedHighlights = getRelatedHighlights(quote);
    // }
</script>

<!-- <div
    class="font-vollkorn highlighter mt-2 flex max-w-max gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-1.5 text-sm text-stone-900 shadow-xl drop-shadow"
>
    {#await tags}
        Loading...
    {:then tags}
        {#each tags.slice(0, 3) as tag}
            <div
                class="tag cursor-pointer shadow-inner transition-all hover:scale-[97%] flex rounded-lg"
                style={`--active-color: ${getRandomLightColor(tag, false)};`}
                on:click={() => {
                    isExpanded = true;
                }}
            >
                <div
                    class="name bg-stone-100 py-1 px-2 rounded-l-lg transition-all font-vollkornSC"
                >
                    {tag}
                </div>
                <div class="count bg-stone-100 py-1 px-2 rounded-r-lg">
                    {Math.round(Math.random() * 10)}
                </div>
            </div>
        {/each}
        <div
            class="cursor-pointer transition-all hover:scale-[97%] bg-white rounded-lg flex py-1 px-2"
        >
            Save
        </div>
    {:catch error}
        Error
    {/await}
</div> -->

{#if related && related.length > 0}
    <div
        class="font-text highlighter mt-2 flex max-w-lg flex-col gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-1.5 text-sm text-stone-900 shadow-xl drop-shadow"
    >
        {#each related.slice(0, 3) as highlight}
            <div class="flex cursor-pointer items-center gap-2">
                <ArticlePreview
                    index={0}
                    article={{
                        url: "http://paulgraham.com/vb.html",
                        title: highlight.title,
                        reading_progress: 0,
                    }}
                    className="shrink-0 w-[100px] h-[120px] transition-transform relative"
                    transform="rotate(1deg) scale(1.1)"
                />
                <div
                    class="flex flex-col gap-2 overflow-hidden overflow-ellipsis rounded-lg bg-stone-100 p-2 shadow-sm"
                    style:min-height="80px"
                    style:display="-webkit-box"
                    style:-webkit-box-orient="vertical"
                    style:-webkit-line-clamp="4"
                >
                    <!-- <div class=""> -->
                    {highlight.excerpt}
                    {highlight.score2.toFixed(2)}
                    <!-- </div> -->
                    <!-- <div
                        class="font-title flex items-center justify-between gap-2 overflow-hidden rounded-b-lg"
                    >
                        <div
                            class="flex-shrink overflow-hidden overflow-ellipsis whitespace-nowrap"
                        >
                            {highlight.title}
                        </div>
                    </div> -->
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
