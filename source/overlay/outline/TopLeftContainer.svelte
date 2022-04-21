<script lang="ts">
    // organize-imports-ignore
    import { dismissedFeedbackMessage } from "../../common/featureFlags";
    import { getFeatureFlag, setFeatureFlag, showFeedbackMessage } from "../../common/featureFlags";
    import { getRemoteFeatureFlag, reportEventContentScript } from "../../content-script/messaging";
    import FeedbackMessage from "./FeedbackMessage.svelte";
    import Outline from "./Outline.svelte";
    import { OutlineItem } from "./parse";
    import UpdateMessage from "./UpdateMessage.svelte";

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
</script>

<div id="lindy-info-topleft-content" class="flex flex-col gap-2">
    {#if outline}
        <Outline outline={outline} activeOutlineIndex={activeOutlineIndex} />
    {/if}
    
    <UpdateMessage />

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
    color: #374151; /* text-gray-700 */
}
#lindy-info-topleft-content > * {
    background-color: var(--lindy-background-color);
}
svg {
    color: #4b5563; ; /* text-gray-600 */
}
</style>
