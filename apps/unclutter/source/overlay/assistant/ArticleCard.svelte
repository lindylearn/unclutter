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
    class="font-vollkorn article-card flex max-w-xs flex-col gap-2 rounded-xl border-[1px] border-stone-100 bg-white p-1.5 text-sm text-stone-900 shadow-xl drop-shadow"
>
    <!-- <div class="font-vollkornSC text-base">{document.title}</div> -->
    <div class="rounded-lg bg-stone-100 p-2">
        {articleSummary}
    </div>
    <div class="font-vollkornSC flex gap-2">
        <div class="rounded-lg bg-stone-100 py-1 px-2">
            {keyPointsCount} key points
        </div>
        <!-- <div class="rounded-lg bg-stone-100 py-1 px-2">
            {readingTimeMinutes} min
        </div> -->
        <!-- <div class="rounded-lg bg-stone-100 py-1 px-2">3 related</div> -->
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

        <div class="rounded-lg bg-stone-100 py-1 px-2" style:background="rgba(250, 204, 21, 0.8)">
            Unclutter article
        </div>
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
