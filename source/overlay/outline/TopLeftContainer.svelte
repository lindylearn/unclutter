<script lang="ts">
    // organize-imports-ignore
    import { dismissedFeedbackMessage } from "distribution/common/featureFlags";
    import { getFeatureFlag, setFeatureFlag, showFeedbackMessage } from "source/common/featureFlags";
    import { getRemoteFeatureFlag, reportEventContentScript } from "source/content-script/messaging";
    import FeedbackMessage from "./FeedbackMessage.svelte";
    import Outline from "./Outline.svelte";
    import { OutlineItem } from "./parse";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;

    let displayFeedbackMessage = false;
    getFeatureFlag(dismissedFeedbackMessage).then(dismissed => {
        if (!dismissed) {
            return getRemoteFeatureFlag(showFeedbackMessage)
        }
    }).then(enabled => {
        displayFeedbackMessage = enabled
    })
    
    function dismissFeedbackMessage() {
        displayFeedbackMessage = false;
        setFeatureFlag(dismissedFeedbackMessage, true)
        reportEventContentScript("dismissedFeedbackRequest")
    }

    console.log("render")
</script>

<div id="lindy-info-topleft-content" class="flex flex-col gap-2">
    {#if outline}
        <Outline outline={outline} activeOutlineIndex={activeOutlineIndex} />
    {/if}
    

    {#if displayFeedbackMessage}
        <FeedbackMessage on:dismissed={dismissFeedbackMessage} />
    {/if}
</div>

<style global lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;

#lindy-info-topleft-content {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto !important;
    margin: 10px;
    margin-left: 20px;
    color: #374151;
}
#lindy-info-topleft-content > * {
    background-color: var(--lindy-background-color);
}
</style>
