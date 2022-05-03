<script lang="ts">
    // organize-imports-ignore
    import { dismissedFeedbackMessage } from "../../common/featureFlags";
    import { getFeatureFlag, setFeatureFlag, showFeedbackMessage } from "../../common/featureFlags";
    import { getRemoteFeatureFlag, reportEventContentScript } from "../../content-script/messaging";
    import FeedbackMessage from "./FeedbackMessage.svelte";
    import Outline from "./Outline.svelte";
    import { OutlineItem } from "./parse";
    import ProgressMessage from "./ProgressMessage.svelte";
    import UpdateMessage from "./UpdateMessage.svelte";
    import { getVersionMessagesToShow, saveDismissedVersionMessage } from "./updateMessages";

    export let outline: OutlineItem[];
    export let activeOutlineIndex: number;
    export let totalAnnotationCount: number

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
    <!-- <ProgressMessage/> -->

    {#if outline}
        <Outline outline={outline} activeOutlineIndex={activeOutlineIndex} totalAnnotationCount={totalAnnotationCount}/>
    {/if}
    
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
    margin-left: 20px;
    color: #374151; /* text-gray-700 */
}
#lindy-info-topleft-content > * {
    background-color: var(--lindy-background-color);
}
svg.message-icon {
    color: #4b5563; /* text-gray-600 */
}
a > .close-message {
    visibility: hidden;
    opacity: 0;
}
a:hover > .close-message {
    visibility: visible;
    opacity: 1;
}
</style>
