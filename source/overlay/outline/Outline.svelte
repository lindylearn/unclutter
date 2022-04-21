<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import { OutlineItem } from "./parse";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
</script>


<div id="outline" class="max-w-full px-5 py-3 cursor-auto bg-white rounded-lg shadow">
    <div>
        <ul class="m-0 p-0 list-none flex flex-col gap-1">
            {#each outline as child, i}
                <Heading {...child} activeOutlineIndex={activeOutlineIndex} />
            {/each}
        </ul>
    </div>
</div>


<style lang="postcss">

</style>
