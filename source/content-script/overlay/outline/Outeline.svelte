<script lang="ts">
    // organize-imports-ignore
    import Heading from "./Heading.svelte";
    import { OutlineItem } from "./parse";

    export let outline: OutlineItem[];
</script>

<div class="lindy-info-topleft">
    <div class="lindy-outline">
        <ul class="lindy-outline-list">
            <Heading {...outline[0]} />
        </ul>
    </div>
</div>
