<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import ProgressCircle from './ProgressCircle.svelte';
    import { OutlineItem } from "./parse";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
</script>


<div id="outline" class="max-w-full pl-7 pr-6 py-4 cursor-auto bg-white rounded-lg shadow hover:shadow-md transition-all relative">
    <div>
        <ul class="m-0 p-0 list-none flex flex-col gap-1">
            {#each outline as child, i}
                <Heading {...child} activeOutlineIndex={activeOutlineIndex} />
            {/each}
        </ul>
    </div>

    <div class="absolute top-3 right-3">
        <ProgressCircle progress={60} caption={'2'} />
    </div>
</div>


<style lang="postcss">

</style>
