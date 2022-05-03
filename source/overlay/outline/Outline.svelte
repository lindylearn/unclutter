<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import ProgressCircle from './ProgressCircle.svelte';
    import { OutlineItem } from "./parse";
    import { scrollToElement } from "./common";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
    export let totalAnnotationCount: number

    const goalAnnotationCount = 6;
</script>


<div id="outline" class="max-w-full px-5 py-4 cursor-auto bg-white rounded-lg shadow hover:shadow-md transition-all relative">
    <div>
        <div class="flex items-center justify-between">
            <div class="text-base font-header font-semibold cursor-pointer" on:click={() => scrollToElement(outline[0].element)}>
                {outline[0]?.title}
            </div>
            <div class="-mr-1">
                <ProgressCircle 
                    progressPercentage={Math.min(1.0, (totalAnnotationCount || 0) / goalAnnotationCount)} 
                    caption={`${totalAnnotationCount || 0}`} 
                />
            </div>
        </div>

        <div class="mt-1">
            <div class="text-sm text-gray-400">20 min left</div>

            {#if outline.length > 1}
                <div class="border-b-2 border-gray-100 -mx-5 mb-2"></div>
            {/if}
        </div>

        <ul class="m-0 p-0 pr-2 list-none flex flex-col gap-1">
            {#each outline.slice(1) as child, i}
                <Heading {...child} activeOutlineIndex={activeOutlineIndex} />
            {/each}
        </ul>
    </div>
</div>


<style lang="postcss">

</style>
