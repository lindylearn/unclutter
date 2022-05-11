<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import ProgressCircle from './ProgressCircle.svelte';
    import { OutlineItem } from "./parse";
    import { scrollToElement } from "./common";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
    export let annotationsEnabled: boolean;
    export let totalAnnotationCount: number
    export let readingTimeLeft: number = null;

</script>


<div id="outline" class="max-w-full px-5 py-4 cursor-auto bg-white rounded-lg shadow hover:shadow-md transition-all relative">
    <div>
        <div class="flex items-center justify-between">
            <div class="text-base font-header font-semibold cursor-pointer" on:click={() => scrollToElement(outline[0].element)}>
                {outline[0]?.title}
            </div>
            {#if annotationsEnabled}
                <div class="-mr-1">
                    <ProgressCircle 
                        totalAnnotationCount={totalAnnotationCount} 
                    />
                </div>
            {/if}
        </div>

        <div class="">
            {#if readingTimeLeft !== null}
                <div class="reading-time text-sm text-gray-400 tabular-nums mt-1">
                    <span class="reading-time-count" style={`--num: ${readingTimeLeft}`}></span> min left
                </div>
            {/if}


            {#if outline.length > 1}
                <div class="spacer-line border-b-2 border-gray-100 -mx-5 mb-2 mt-1"></div>
            {/if}
        </div>

        <ul class="m-0 p-0 list-none flex flex-col gap-1">
            {#each outline.slice(1) as child, i}
                <Heading 
                    {...child} 
                    activeOutlineIndex={activeOutlineIndex} 
                    annotationsEnabled={annotationsEnabled}
                    socialAnnotationsEnabled={outline.slice(1).some(h => h.hasSocialAnnotations)}
                />
            {/each}
        </ul>
    </div>
</div>


<style lang="postcss">
    /* define --num as integer, required for the counter transition */
    /* this does not work in firefox, but the value change still works */
    @property --num {
        syntax: '<integer>';
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
</style>
