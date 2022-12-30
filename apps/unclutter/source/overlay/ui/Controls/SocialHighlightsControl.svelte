<script lang="ts">
    import browser from "../../../common/polyfill";
    import {
        enableSocialCommentsFeatureFlag,
        getFeatureFlag,
        setFeatureFlag,
    } from "../../../common/featureFlags";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
    import AnnotationsModifier from "../../../content-script/modifications/annotations/annotationsModifier";
    import OverlayManager from "../../../content-script/modifications/overlay";
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
        setFeatureFlag(enableSocialCommentsFeatureFlag, socialHighlightsEnabled);
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

{#if socialHighlightsCount}
    <UiControl
        iconName={socialHighlightsEnabled ? "social_enabled" : "social_disabled"}
        tooltip={socialHighlightsEnabled
            ? `Click to hide ${socialHighlightsCount || 0} social comment${
                  socialHighlightsCount !== 1 ? "s" : ""
              }`
            : `Click to show ${socialHighlightsCount || 0} social comment${
                  socialHighlightsCount !== 1 ? "s" : ""
              }`}
        onClick={toggleEnabled}
    >
        <div id="lindy-crowd-count-label">
            {socialHighlightsCount}
        </div>
    </UiControl>
{/if}

<style lang="postcss">
    #lindy-crowd-count-label {
        all: revert !important;
        position: absolute !important;
        top: 68% !important;
        left: 56% !important;
        padding: 2px 4px !important;

        background: var(--background-color) !important;
        border-radius: 4px !important;
        filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.05)) !important;
        cursor: pointer !important;

        color: var(--text-color) !important;
        font-family: Poppins, sans-serif !important;
        font-weight: 600 !important;
        font-size: 11px !important;
    }
</style>
