<script lang="ts">
    export let readingTimeMinutes: number;
    export let keyPointsCount: number | null;
    export let articleSummary: string | null;
</script>

<div
    class="fixed top-0 right-0 h-0 w-0"
    style="border-width: 0 80px 80px 0; border-style: solid; border-color: transparent rgba(250, 204, 21, 1.0);"
>
    <div
        class="font-vollkorn absolute text-2xl font-normal"
        style="top: 5px; left: calc(80px - 30px)"
    >
        {keyPointsCount}
    </div>
</div>
<div class="fixed right-0 top-0 h-screen w-1" style="background: rgba(250, 204, 21, 1.0)" />

<style lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
