<script lang="ts">
    import ky from "ky";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common";
    import { RelatedHighlight } from "../../content-script/modifications/DOM/smartHighlights";

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

{#if related?.length > 0}
    <div
        class="font-text highlighter mt-2 flex flex-col gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-1.5 text-sm text-stone-900 shadow-xl drop-shadow"
    >
        {#each related.slice(0, 3) as highlight}
            <div
                class="flex max-w-lg cursor-pointer flex-col gap-2 rounded-lg bg-stone-100 p-2 shadow-sm transition-all hover:scale-[99%]"
            >
                <div class="">{highlight.score} "{highlight.excerpt}"</div>
                <div
                    class="font-title flex items-center justify-between gap-2 overflow-hidden rounded-b-lg"
                >
                    <div class="flex-shrink overflow-hidden overflow-ellipsis whitespace-nowrap">
                        {highlight.title}
                    </div>
                    <!-- <svg class="w-4 shrink-0" viewBox="0 0 448 512"
                        ><path
                            fill="currentColor"
                            d="M264.6 70.63l176 168c4.75 4.531 7.438 10.81 7.438 17.38s-2.688 12.84-7.438 17.38l-176 168c-9.594 9.125-24.78 8.781-33.94-.8125c-9.156-9.5-8.812-24.75 .8125-33.94l132.7-126.6H24.01c-13.25 0-24.01-10.76-24.01-24.01s10.76-23.99 24.01-23.99h340.1l-132.7-126.6C221.8 96.23 221.5 80.98 230.6 71.45C239.8 61.85 254.1 61.51 264.6 70.63z"
                        /></svg
                    > -->
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
        animation: highlighterFadeIn 100ms cubic-bezier(0.34, 1.56, 0.64, 1); /* easeOutBack */
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
