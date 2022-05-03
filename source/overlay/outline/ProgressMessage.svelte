<script lang="ts">
    import { reportEventContentScript } from 'source/content-script/messaging';
    import { createEventDispatcher } from 'svelte';
    import ProgressCircle from './ProgressCircle.svelte';


    const dispatch = createEventDispatcher();
</script>

<div class="feedback-container max-w-full px-2 py-2 pr-3 cursor-pointer relative rounded-lg shadow hover:shadow-md transition-all">   
    <div class="flex items-center justify-end gap-1">
        <div class="flex-shrink-0">
            <ProgressCircle progress={60} caption={'2'} />
        </div>
        <!-- <span class="text-sm font-bold">
            Annotations
        </span> -->
    </div>

</div>

<style lang="postcss">

</style>
