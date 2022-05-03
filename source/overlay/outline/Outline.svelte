<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import ProgressCircle from './ProgressCircle.svelte';
    import { OutlineItem } from "./parse";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
</script>


<div id="outline" class="max-w-full px-4 py-3 cursor-auto bg-white rounded-lg shadow hover:shadow-md transition-all relative">
    <div>
        <div>
            <div class="text-sm font-header font-semibold cursor-pointer pr-8">
                {outline[0].title}
            </div>
            <div class="absolute top-3 right-3">
                <ProgressCircle progress={60} caption={'2'} />
            </div>
        </div>
        <div class="border-b-2 decoration-gray-200 -mx-4 my-2"></div>

        <ul class="m-0 p-0 pl-4 list-none flex flex-col gap-1">
            {#each outline.slice(1) as child, i}
                <Heading {...child} activeOutlineIndex={activeOutlineIndex} />
            {/each}
        </ul>
    </div>
</div>


<style lang="postcss">

</style>
