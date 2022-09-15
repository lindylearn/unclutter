<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import ProgressCircle from "./ProgressCircle.svelte";
    import { OutlineItem } from "./parse";
    import { scrollToElement } from "./common";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
    export let annotationsEnabled: boolean;
    export let totalAnnotationCount: number;
    export let readingTimeLeft: number = null;
</script>

<div
    id="outline"
    class="relative max-w-full cursor-auto rounded-lg bg-white px-5 py-4 shadow transition-all"
>
    <div>
        <div class="flex justify-between">
            <div
                class="cursor-pointer select-none font-header text-base font-semibold"
                on:click={() => scrollToElement(outline[0].element)}
            >
                {outline[0]?.title}
            </div>
            {#if annotationsEnabled}
                <div class="progress-container -mr-1 -mt-0.5 h-0">
                    <ProgressCircle {totalAnnotationCount} />
                </div>
            {/if}
        </div>

        <div class="">
            {#if readingTimeLeft !== null}
                <div
                    class="reading-time mt-1 text-sm tabular-nums text-gray-500"
                >
                    <span
                        class="reading-time-count"
                        style={`--num: ${readingTimeLeft}`}
                    /> min left
                </div>
            {/if}

            {#if outline.length > 1}
                <div
                    class="spacer-line -mx-5 mb-2 mt-1 border-b-2 border-gray-100"
                />
            {/if}
        </div>

        <ul class="m-0 flex list-none flex-col gap-1 p-0">
            {#each outline.slice(1) as child, i}
                <Heading
                    {...child}
                    {activeOutlineIndex}
                    {annotationsEnabled}
                    socialAnnotationsEnabled={outline
                        .slice(1)
                        .some((h) => h.socialCommentsCount)}
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
</style>
