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
    class="max-w-full px-5 py-4 cursor-auto bg-white rounded-lg shadow transition-all relative"
>
    <div>
        <div class="flex justify-between">
            <div
                class="text-base font-header font-semibold cursor-pointer"
                on:click={() => scrollToElement(outline[0].element)}
            >
                {outline[0]?.title}
            </div>
            {#if annotationsEnabled}
                <div class="progress-container h-0 -mr-1 -mt-0.5">
                    <ProgressCircle {totalAnnotationCount} />
                </div>
            {/if}
        </div>

        <div class="">
            {#if readingTimeLeft !== null}
                <div
                    class="reading-time text-sm text-gray-400 tabular-nums mt-1"
                >
                    <span
                        class="reading-time-count"
                        style={`--num: ${readingTimeLeft}`}
                    /> min left
                </div>
            {/if}

            {#if outline.length > 1}
                <div
                    class="spacer-line border-b-2 border-gray-100 -mx-5 mb-2 mt-1"
                />
            {/if}
        </div>

        <ul class="m-0 p-0 list-none flex flex-col gap-1">
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
