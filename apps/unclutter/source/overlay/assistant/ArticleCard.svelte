<script lang="ts">
    import ky from "ky";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common";

    export let readingTimeMinutes: number;
    export let keyPointsCount: number | null;
    export let articleSummary: string | null;

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
</script>

<div
    class="font-vollkorn article-card flex max-w-sm flex-col gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-1.5 text-sm text-stone-900 shadow-xl drop-shadow"
>
    <!-- <div class="font-vollkornSC text-base">{document.title}</div> -->
    <div class="rounded-lg bg-stone-100 p-2">
        {articleSummary}
    </div>
    <div class="font-vollkornSC flex gap-2">
        <div class="rounded-lg bg-stone-100 py-1 px-2">{readingTimeMinutes} min</div>
        <div class="rounded-lg bg-stone-100 py-1 px-2">{keyPointsCount} key quotes</div>
        <!-- <div class="rounded-lg bg-stone-100 py-1 px-2">3 related</div> -->
    </div>
</div>

<style lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .article-card {
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
</style>
