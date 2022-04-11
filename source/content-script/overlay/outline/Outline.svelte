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
            <Heading {...outline} activeOutlineIndex={activeOutlineIndex} />
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

    animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    animation-delay: 0s;
    animation-fill-mode: both;
}
@keyframes fadeIn {
    from {
        visibility: hidden;
        opacity: 0;
        transform: translate3d(-200px, 0, 0);
    }
    to {
        visibility: visible;
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}
</style>
