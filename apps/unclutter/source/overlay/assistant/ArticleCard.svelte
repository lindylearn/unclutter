<script lang="ts">
    import ky from "ky";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common";
    import AnimatedNumber from "../outline/Library/AnimatedNumber.svelte";
    import clsx from "clsx";
    import { RelatedHighlight } from "../../content-script/modifications/DOM/smartHighlights";

    export let readingTimeMinutes: number;
    export let keyPointsCount: number | null;
    export let relatedCount: number | null;
    export let relatedArticles: RelatedHighlight[] | null;
    export let articleSummary: string | null;
    export let enablePageView: (reason: string) => void;

    // async function getRelatedHighlights(): Promise<any[]> {
    //     const articles: any[] = await ky
    //         .post("https://assistant-two.vercel.app/api/query", {
    //             json: {
    //                 query: document.body.innerText.trim().split(/\s+/).join("\n").slice(0, 2000),
    //             },
    //         })
    //         .json();
    //     console.log(articles);

    //     return articles.filter((h) => h.score >= 0.4).slice(0, 3);
    // }
    // let relatedHighlights = null;
    // $: relatedHighlights = getRelatedHighlights();
</script>

<div
    class="article-card ml-auto flex w-max flex-col overflow-hidden rounded-lg bg-gradient-to-b from-yellow-300 to-amber-400 text-sm text-stone-900 shadow drop-shadow transition-transform hover:scale-x-[98%] hover:scale-y-[99.5%]"
    style:background-image="linear-gradient(120deg, var(--tw-gradient-stops))"
>
    <div class="font-title flex items-stretch">
        <!-- <input class="w-20 bg-white px-2 outline-none placeholder:text-stone-400" /> -->

        <div class="ml-0.5 flex items-center gap-1 px-1.5">
            <svg class="w-4" viewBox="0 0 576 512"
                ><path
                    fill="currentColor"
                    d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                /></svg
            >
            {keyPointsCount}
        </div>
        {#if relatedCount}
            <div class="flex items-center gap-1 px-1.5">
                <svg class="-mt-0.5 w-4" viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M425 182c-3.027 0-6.031 .1758-9 .5195V170C416 126.4 372.8 96 333.1 96h-4.519c.3457-2.969 .5193-5.973 .5193-9c0-48.79-43.92-87-100-87c-56.07 0-100 38.21-100 87c0 3.027 .1761 6.031 .5218 9h-56.52C33.2 96 0 129.2 0 170v66.21C0 253.8 6.77 269.9 17.85 282C6.77 294.1 0 310.2 0 327.8V438C0 478.8 33.2 512 73.1 512h110.2c17.63 0 33.72-6.77 45.79-17.85C242.1 505.2 258.2 512 275.8 512h58.21C372.8 512 416 481.6 416 438v-56.52c2.969 .3438 5.973 .5195 9 .5195C473.8 382 512 338.1 512 282S473.8 182 425 182zM425 334c-26.35 0-25.77-26-45.21-26C368.9 308 368 316.9 368 327.8V438c0 14.36-19.64 26-34 26h-58.21C264.9 464 256 455.1 256 444.2c0-19.25 25.1-18.88 25.1-45.21c0-21.54-23.28-39-52-39c-28.72 0-52 17.46-52 39c0 26.35 26 25.77 26 45.21C204 455.1 195.1 464 184.2 464H73.1C59.64 464 48 452.4 48 438v-110.2C48 316.9 56.86 308 67.79 308c19.25 0 18.88 26 45.21 26c21.54 0 39-23.28 39-52s-17.46-52-39-52C86.65 230 87.23 256 67.79 256C56.86 256 48 247.1 48 236.2V170C48 155.6 59.64 144 73.1 144h110.2C195.1 144 204 143.1 204 132.2c0-19.25-26-18.88-26-45.21c0-21.54 23.28-39 52-39c28.72 0 52 17.46 52 39C281.1 113.4 256 112.8 256 132.2C256 143.1 264.9 144 275.8 144h58.21C348.4 144 368 155.6 368 170v66.21C368 247.1 368.9 256 379.8 256c19.25 0 18.88-26 45.21-26c21.54 0 39 23.28 39 52S446.5 334 425 334z"
                    />
                </svg>
                {relatedCount}
            </div>
        {/if}

        <div
            class="lindy-button cursor-pointer rounded-r-lg px-2 py-1.5 font-bold transition-all"
            on:click={() => enablePageView("summary-card")}
        >
            Unclutter
        </div>
    </div>
</div>

{#if articleSummary}
    <div
        class="article-card mt-2 flex w-max max-w-xs flex-col gap-2 rounded-lg bg-white text-sm text-stone-900 shadow-md drop-shadow transition-all hover:rotate-[0.5deg]"
    >
        <div class="font-text p-2">
            {articleSummary}
        </div>
    </div>
{/if}

<!-- <div
    class="font-text highlighter mt-2 flex flex-col gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-1.5 text-xs text-stone-900 shadow-xl drop-shadow"
>
    {#each relatedArticles as related}
        <div
            class="flex max-w-xs cursor-pointer flex-col gap-2 rounded-lg bg-stone-100 p-2 shadow-sm transition-all hover:scale-[99%]"
        >
            <div class="">"{related.text.slice(0, 100)}" {related.score.toFixed(2)}</div>
            <div
                class="font-title flex items-center justify-between gap-2 overflow-hidden rounded-b-lg"
            >
                <div class="flex-shrink overflow-hidden overflow-ellipsis whitespace-nowrap">
                    {related.title}
                </div>
            </div>
        </div>
    {/each}
</div> -->
<style lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    .article-card {
        animation: pageCardBounceIn 0.75s;
        animation-fill-mode: backwards;
    }

    .lindy-button:hover {
        background: rgba(255, 255, 255, 0.5) !important;
    }

    @keyframes pageCardBounceIn {
        0% {
            transform: translateY(-100%) rotate(-5deg);
            opacity: 0;
        }
        12% {
            transform: translateY(-89.11%) rotate(-4.4deg);
        }
        24% {
            transform: translateY(-56.44%) rotate(-3.2deg);
        }
        36% {
            transform: translateY(-1.99%) rotate(-1.6deg);
        }
        54% {
            transform: translateY(-24.98%) rotate(0deg);
        }
        74% {
            transform: translateY(-1.63%) rotate(0deg);
        }
        82% {
            transform: translateY(-6.25%) rotate(0deg);
        }
        92% {
            transform: translateY(-0.66%) rotate(0deg);
        }
        96% {
            transform: translateY(-1.54%) rotate(0deg);
        }
        100% {
            opacity: 1;
            transform: translateY(0%) rotate(0deg);
        }
    }

    .animated-number > .before-value {
        animation: animateNumberOut 0.4s cubic-bezier(0.5, 1, 0.89, 1) 0.5s; /* easeOutQuad */
        animation-fill-mode: both;
    }
    .animated-number > .after-value {
        animation: animateNumberIn 0.4s cubic-bezier(0.5, 1, 0.89, 1) 0.5s; /* easeOutQuad */
        animation-fill-mode: both;
    }
    @keyframes animateNumberOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-5px);
        }
    }
    @keyframes animateNumberIn {
        from {
            opacity: 0;
            transform: translateY(5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
