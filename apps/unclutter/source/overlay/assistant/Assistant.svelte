<script lang="ts">
    import ky from "ky";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common";

    export let quote: string;

    async function getTags(quote: string): Promise<string[]> {
        return await ky
            .post("https://assistant-two.vercel.app/api/tag", {
                json: {
                    text: quote,
                },
            })
            .json();
    }
    let tags = getTags(quote);

    async function getRelatedHighlights(quote: string): Promise<any[]> {
        return await ky
            .post("https://assistant-two.vercel.app/api/query", {
                json: {
                    query: quote,
                },
            })
            .json();
    }
    let isExpanded = false;
    let relatedHighlights = null;
    $: if (isExpanded) {
        relatedHighlights = getRelatedHighlights(quote);
    }
</script>

<div
    class="highlighter mt-2 flex max-w-max gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-2 shadow-xl drop-shadow"
>
    {#await tags}
        Loading...
    {:then tags}
        {#each tags.slice(0, 3) as tag}
            <div
                class="tag cursor-pointer text-stone-900 shadow-inner transition-all hover:scale-[97%] flex rounded-lg"
                style={`--active-color: ${getRandomLightColor(tag, false)};`}
                on:click={() => {
                    isExpanded = true;
                }}
            >
                <div class="name bg-stone-100 py-1 px-2 rounded-l-lg transition-all">{tag}</div>
                <div class="count bg-stone-200 py-1 px-2 rounded-r-lg">
                    {Math.round(Math.random() * 10)}
                </div>
            </div>
        {/each}
        <div
            class="cursor-pointer text-stone-900 transition-all hover:scale-[97%] bg-white rounded-lg flex py-1 px-2"
        >
            Save
        </div>
    {:catch error}
        Error
    {/await}
</div>

{#if isExpanded}
    {#await relatedHighlights then relatedHighlights}
        <div
            class="highlighter mt-2 flex flex-col gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-2 shadow-xl drop-shadow"
        >
            {#each relatedHighlights as highlight}
                <div
                    class="text-stone-900 max-w-lg bg-stone-100 p-2 rounded-lg cursor-pointer shadow-sm transition-all hover:scale-[99%]"
                >
                    "{highlight.metadata.text}"
                </div>
            {/each}
        </div>
    {/await}
{/if}

<style lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .highlighter {
        /* font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
            Cantarell, "Open Sans", "Helvetica Neue", sans-serif; */
        font-family: "Vollkorn", serif;

        animation: highlighterFadeIn 100ms cubic-bezier(0.34, 1.56, 0.64, 1); /* easeOutBack */
        animation-fill-mode: both;
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
