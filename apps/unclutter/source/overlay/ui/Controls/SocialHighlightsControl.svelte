<script lang="ts">
    import browser from "../../../common/polyfill";
    import {
        enableSocialCommentsFeatureFlag,
        getFeatureFlag,
        setFeatureFlag,
    } from "../../../common/featureFlags";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common";
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

<UiControl
    iconName={socialHighlightsEnabled ? "social_enabled" : "social_disabled"}
    tooltip={socialHighlightsEnabled
        ? `Click to hide ${socialHighlightsCount || 0} social highlight${
              socialHighlightsCount !== 1 ? "s" : ""
          }`
        : `Click to show ${socialHighlightsCount || 0} social highlight${
              socialHighlightsCount !== 1 ? "s" : ""
          }`}
    onClick={toggleEnabled}
>
    {#if socialHighlightsCount}
        <div id="lindy-crowd-count-label">
            {socialHighlightsCount}
        </div>
    {/if}
</UiControl>

<style lang="postcss">
    #lindy-crowd-count-label {
        all: revert;
        position: absolute;
        top: 68%;
        left: 56%;
        padding: 2px 4px;

        background: var(--background-color);
        border-radius: 4px;
        filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.05));
        cursor: pointer;

        color: var(--text-color);
        font-family: Poppins, sans-serif;
        font-weight: 600;
        font-size: 11px;
    }
</style>
