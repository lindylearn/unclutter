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
</script>

<div
    class="highlighter mt-2 flex gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-2 shadow-xl drop-shadow"
>
    {#await tags}
        Loading...
    {:then tags}
        {#each tags as tag}
            <div
                class="tag cursor-pointer rounded-lg py-1 px-2 text-stone-900 shadow-sm transition-all hover:scale-[97%] bg-stone-100"
                style={`--active-color: ${getRandomLightColor(tag, false)};`}
            >
                {tag}
            </div>
        {/each}
    {:catch error}
        Error
    {/await}
</div>

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

    .tag:hover {
        background-color: var(--active-color);
    }
</style>
