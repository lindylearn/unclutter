<script lang="ts">
    // organize-imports-ignore
    import { dismissedFeedbackMessage } from "../../common/featureFlags";
    import { getFeatureFlag, setFeatureFlag, showFeedbackMessage } from "../../common/featureFlags";
    import { getRemoteFeatureFlag, reportEventContentScript } from "../../content-script/messaging";
    import FeedbackMessage from "./FeedbackMessage.svelte";
    import Outline from "./Outline.svelte";
    import { OutlineItem } from "./parse";
    import UpdateMessage from "./UpdateMessage.svelte";
    import { getVersionMessagesToShow, saveDismissedVersionMessage } from "./updateMessages";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
    export let annotationsEnabled: boolean;
    export let totalAnnotationCount: number = 0;
    export let readingTimeLeft: number = null;

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

    let updateMessages = []
    getVersionMessagesToShow().then(messages => {
        updateMessages = messages
    })
    function dismissUpdateMessage(dismissedVersion: string) {
        updateMessages = updateMessages.filter(({ version }) => version !== dismissedVersion)
        saveDismissedVersionMessage(dismissedVersion)
        reportEventContentScript("dismissedUpdateMessage", { version: dismissedVersion })
    }

</script>

<div id="lindy-info-topleft-content" class="flex flex-col gap-1.5 font-paragraph">
    <Outline 
        outline={outline} 
        activeOutlineIndex={activeOutlineIndex} 
        annotationsEnabled={annotationsEnabled} 
        totalAnnotationCount={totalAnnotationCount} 
        readingTimeLeft={readingTimeLeft} 
    />
    
    {#each updateMessages as { version, updateMessage }}
        <UpdateMessage version={version} updateMessage={updateMessage} on:dismissed={() => dismissUpdateMessage(version)} />
    {/each}

    {#if displayFeedbackMessage}
        <FeedbackMessage on:dismissed={dismissFeedbackMessage} />
    {/if}
</div>

<style global lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;

#lindy-info-topleft-content {
    margin: 10px;
    color: #374151; /* text-gray-700 */
}
#lindy-info-topleft-content > * {
    background-color: var(--lindy-background-color);
}
svg.icon > path {
    fill: currentColor;
    stroke: currentColor;
    stroke-width: 10px;
}
/* a > .close-message {
    visibility: hidden;
    opacity: 0;
}
a:hover > .close-message {
    visibility: visible;
    opacity: 1;
} */

/* setup tooltips (adapted from overlay css) */
.lindy-tooltip {
    position: relative;

    --background-color: var(--lindy-background-color);
    --text-color: #374151; /* text-gray-700 */;
}
.lindy-tooltip:before,
.lindy-tooltip:after {
    position: absolute;
    display: block;
    pointer-events: none;

    opacity: 0;
}
.lindy-tooltip:before {
    /* box */
    top: 6px;
    right: calc(100% + 9px);
    padding: 6px 8px;

    display: block;
    content: attr(data-title);
    font-size: 13px;

    background: var(--background-color);
    color: var(--text-color);
    border-radius: 5px;
    white-space: nowrap;
    /* filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06)); */

    font-family: Poppins, sans-serif;
    line-height: 1;
}
.lindy-tooltip:after {
    /* arrow */
    top: 13px;
    right: calc(100% + 3px);
    height: 0;
    width: 0;
    content: "";

    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid var(--background-color);
}
.lindy-tooltip.lindy-fade:after,
.lindy-tooltip.lindy-fade:before {
    transform: translate3d(10px, 0, 0);
    transition: all 0.15s ease-in-out;
}
.lindy-tooltip.lindy-fade:hover:after,
.lindy-tooltip.lindy-fade:hover:before {
    opacity: 1;
    transform: translate3d(0, 0, 0);
}
</style>
