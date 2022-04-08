<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import { OutlineItem } from "./parse";

    export let outline: OutlineItem[];
</script>

<div class="lindy-info-topleft bg-red-400">
    <div class="lindy-outline">
        <ul class="lindy-outline-list bg-yellow-50">
            <Heading {...outline[0]} />
        </ul>
    </div>
</div>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
