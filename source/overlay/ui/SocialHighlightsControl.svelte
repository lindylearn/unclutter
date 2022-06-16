<script lang="ts">
    import browser from "../../common/polyfill";
    import { enableSocialCommentsFeatureFlag } from "../../../distribution/common/featureFlags";
    import { getFeatureFlag, setFeatureFlag } from "../../common/featureFlags";
    import { reportEventContentScript } from "../../content-script/messaging";
    import AnnotationsModifier from "../../content-script/modifications/annotations/annotationsModifier";
    import OverlayManager from "../../content-script/modifications/overlay";
    import UiControl from "./UIControl.svelte";

    export let annotationsModifer: AnnotationsModifier;
    export let overlayModifier: OverlayManager;
    export let anchoredSocialHighlightsCount: number = null;

    let socialHighlightsEnabled: boolean = true;
    getFeatureFlag(enableSocialCommentsFeatureFlag).then((defaultEnabled) => {
        socialHighlightsEnabled = defaultEnabled;
    });

    function toggleEnabled() {
        socialHighlightsEnabled = !socialHighlightsEnabled;

        annotationsModifer.setShowSocialAnnotations(socialHighlightsEnabled);
        setFeatureFlag(
            enableSocialCommentsFeatureFlag,
            socialHighlightsEnabled
        );
        if (socialHighlightsEnabled) {
            browser.runtime.sendMessage(null, {
                event: "showAnnotationsCount",
            });
        } else {
            overlayModifier.disableSocialAnnotations();
        }

        reportEventContentScript("toggleSocialAnnotations", {
            newState: socialHighlightsEnabled,
        });
    }

    $: socialHighlightsCount = anchoredSocialHighlightsCount;
    // display cached count before highlights anchored
    browser.runtime
        .sendMessage({ event: "getSocialAnnotationsCount" })
        .then((initialCount: number) => {
            if (!socialHighlightsCount) {
                socialHighlightsCount = initialCount;
            }
        });
</script>

<div id="lindy-crowd-toggle-container">
    <div id="lindy-crowd-toggle-content" class="lindy-tooltp lindy-fade">
        <UiControl
            iconName={socialHighlightsEnabled
                ? "social_enabled"
                : "social_disabled"}
            tooltip={socialHighlightsEnabled
                ? `Click to hide ${
                      socialHighlightsCount || 0
                  } social highlights`
                : `Click to show ${
                      socialHighlightsCount || 0
                  } social highlights`}
            onClick={toggleEnabled}
        />
    </div>
    {#if socialHighlightsCount}
        <div id="lindy-crowd-count-label">
            {socialHighlightsCount}
        </div>
    {/if}
</div>

<style global lang="postcss">
</style>
