<script lang="ts">
    import { OutlineItem } from "./parse";

    export let title: string;
    export let children: OutlineItem[];
</script>

<li class="lindy-outline-item">
    <span>{title}</span>
    {#if children.length > 0}
        <ul>
            {#each children as child}
                <svelte:self {...child}/>
            {/each}
        </ul>
    {/if}
</li>
