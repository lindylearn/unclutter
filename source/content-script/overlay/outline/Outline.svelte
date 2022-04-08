<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import { OutlineItem } from "./parse";

    export let outline: OutlineItem;
    export let activeOutlineIndex: number;
</script>

<div id="lindy-info-topleft" class="fixed left-0 top-0 p-3 cursor-auto">
    <div>
        <ul class="m-0 p-0 list-none flex flex-col gap-2">
            <Heading {...outline} outlineIndex={0} activeOutlineIndex={activeOutlineIndex} />
        </ul>
    </div>
</div>

<style global lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;

#lindy-info-topleft {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto !important;
}
</style>
