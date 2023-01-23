<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import { OutlineItem } from "./parse";
    import { scrollToElement } from "./common";
    import ResourceStat from "../Library/ResourceStat.svelte";
    import type { UserInfo } from "@unclutter/library-components/dist/store";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
    export let annotationsEnabled: boolean;
    export let totalAnnotationCount: number | undefined;
    export let totalRelatedCount: number | undefined;
    export let readingTimeLeft: number = null;
    export let userInfo: UserInfo | undefined;
</script>

<div
    id="outline"
    class="relative max-w-full cursor-auto rounded-lg bg-white p-3 px-4 shadow transition-all"
>
    <div>
        <div class="flex items-center justify-between gap-2">
            <div
                class="font-title cursor-pointer select-none overflow-hidden overflow-ellipsis text-base font-semibold leading-tight"
                style:display="-webkit-box"
                style:-webkit-box-orient="vertical"
                style:-webkit-line-clamp="2"
                on:click={() => scrollToElement(outline[0].element)}
            >
                {outline[0]?.title}
            </div>

            {#if userInfo?.aiEnabled}
                <div class="">
                    {#if totalRelatedCount === undefined}
                        <div class="loader h-4 w-4 shrink-0" />
                    {:else}
                        <ResourceStat type="related" value={totalRelatedCount} />
                    {/if}
                </div>
            {/if}
        </div>

        <div class="">
            {#if readingTimeLeft !== null}
                <div
                    class="reading-time mt-1 text-sm tabular-nums text-stone-400 dark:text-stone-600"
                >
                    <span class="reading-time-count" style={`--num: ${readingTimeLeft}`} /> min left
                </div>
            {/if}

            {#if outline.length > 1}
                <div class="spacer-line -mx-4 mb-2 mt-1 border-b-2 border-gray-100" />
            {/if}
        </div>

        <ul class="flex list-none flex-col gap-1">
            {#each outline.slice(1) as child, i}
                <Heading
                    {...child}
                    {activeOutlineIndex}
                    {annotationsEnabled}
                    {totalAnnotationCount}
                    socialAnnotationsEnabled={outline.slice(1).some((h) => h.socialCommentsCount)}
                />
            {/each}
        </ul>
    </div>
</div>

<style lang="postcss">
    /* define --num as integer, required for the counter transition */
    /* this does not work in firefox, but the value change still works */
    @property --num {
        syntax: "<integer>";
        initial-value: 0;
        inherits: false;
    }

    .reading-time-count {
        transition: --num 0.2s ease-in-out;
        counter-reset: num var(--num);
    }
    .reading-time-count::after {
        content: counter(num);
    }

    .progress-container {
        animation-duration: 0.3s;
        animation-name: fadeInFromNone;
        animation-fill-mode: forwards;
    }
    @keyframes fadeInFromNone {
        0% {
            opacity: 0;
        }
        1% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    .loader {
        border-radius: 50%;
        position: relative;
        animation: rotate 1s linear infinite;
    }
    .loader::before {
        content: "";
        box-sizing: border-box;
        position: absolute;
        inset: 0px;
        border-radius: 50%;
        border: 2px solid currentColor;
        animation: prixClipFix 10s linear infinite;
    }
    @keyframes rotate {
        100% {
            transform: rotate(360deg);
        }
    }
    @keyframes prixClipFix {
        0% {
            clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0);
        }
        25% {
            clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 0, 100% 0, 100% 0);
        }
        50% {
            clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 100% 100%, 100% 100%);
        }
        75% {
            clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%);
        }
        100% {
            clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0);
        }
    }
</style>
