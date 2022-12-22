<script lang="ts">
    import ky from "ky";
    import { getRandomLightColor } from "@unclutter/library-components/dist/common";

    export let readingTimeMinutes: number;
    export let keyPointsCount: number | null;
    export let articleSummary: string | null;
    export let enablePageView: (reason: string) => void;

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
    class="article-card flex max-w-xs flex-col gap-2 rounded-lg bg-gradient-to-b from-yellow-300 to-amber-400 text-sm text-stone-900 shadow-md drop-shadow transition-all hover:rotate-[0.5deg]"
    style:background-image="linear-gradient(120deg, var(--tw-gradient-stops))"
>
    <!-- <div class="font-vollkornSC text-base">{document.title}</div> -->
    <!-- <div class="font-text rounded-lg">
        {articleSummary}
    </div> -->
    <div class="font-title flex font-bold">
        <div class="flex-grow" />

        <!-- <div class="flex items-center gap-1 py-1 px-2">
            <svg class="-mt-0.5 w-4" viewBox="0 0 512 512">
                <path
                    fill="currentColor"
                    d="M512 288c0 35.35-21.49 64-48 64c-32.43 0-31.72-32-55.64-32C394.9 320 384 330.9 384 344.4V480c0 17.67-14.33 32-32 32h-71.64C266.9 512 256 501.1 256 487.6C256 463.1 288 464.4 288 432c0-26.51-28.65-48-64-48s-64 21.49-64 48c0 32.43 32 31.72 32 55.64C192 501.1 181.1 512 167.6 512H32c-17.67 0-32-14.33-32-32v-135.6C0 330.9 10.91 320 24.36 320C48.05 320 47.6 352 80 352C106.5 352 128 323.3 128 288S106.5 223.1 80 223.1c-32.43 0-31.72 32-55.64 32C10.91 255.1 0 245.1 0 231.6v-71.64c0-17.67 14.33-31.1 32-31.1h135.6C181.1 127.1 192 117.1 192 103.6c0-23.69-32-23.24-32-55.64c0-26.51 28.65-47.1 64-47.1s64 21.49 64 47.1c0 32.43-32 31.72-32 55.64c0 13.45 10.91 24.36 24.36 24.36H352c17.67 0 32 14.33 32 31.1v71.64c0 13.45 10.91 24.36 24.36 24.36c23.69 0 23.24-32 55.64-32C490.5 223.1 512 252.7 512 288z"
                />
            </svg>
            {keyPointsCount} related
        </div> -->

        <div class="lindy-button cursor-pointer rounded-r-lg px-2 py-1.5 transition-all">Save</div>

        <div class="lindy-button cursor-pointer rounded-r-lg px-2 py-1.5 transition-all">
            Summarize
        </div>

        <div
            class="lindy-button cursor-pointer rounded-r-lg px-2 py-1.5 transition-all"
            on:click={() => enablePageView("summary-card")}
        >
            Unclutter
        </div>
    </div>
</div>

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
</style>
