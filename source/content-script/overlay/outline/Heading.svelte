<script lang="ts">
    import { OutlineItem } from "./parse";

    export let title: string;
    export let children: OutlineItem[];
</script>

<li class="">
    <span class="text-sm text-gray-600 font-medium">{title}</span>
    {#if children.length > 0}
        <ul class="m-0 ml-5 p-0 list-none mt-1 flex flex-col gap-1">
            {#each children as child}
                <svelte:self {...child}/>
            {/each}
        </ul>
    {/if}
</li>

