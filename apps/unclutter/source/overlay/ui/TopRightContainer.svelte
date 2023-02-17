<script lang="ts">
    import browser from "../../common/polyfill";
    import UIControl from "./Controls/UIControl.svelte";
    import PrivateNotesControl from "./Controls/PrivateNotesControl.svelte";
    import type AnnotationsModifier from "../../content-script/modifications/annotations/annotationsModifier";
    import type ThemeModifier from "../../content-script/modifications/CSSOM/theme";
    import type OverlayManager from "../../content-script/modifications/overlay";
    import SocialHighlightsControl from "./Controls/SocialHighlightsControl.svelte";
    import ThemeControl from "./Controls/ThemeControl.svelte";
    import BugReportControl from "./Controls/BugReportControl.svelte";
    import type ElementPickerModifier from "../../content-script/modifications/elementPicker";
    import type SmartHighlightsProxy from "../../content-script/modifications/DOM/smartHighlightsProxy";
    import clsx from "clsx";

    export let themeModifier: ThemeModifier;
    export let annotationsModifer: AnnotationsModifier;
    export let smartHighlightsProxy: SmartHighlightsProxy;
    export let overlayModifier: OverlayManager;
    export let elementPickerModifier: ElementPickerModifier;
    export let darkModeEnabled: boolean = false;

    export let domain: string;
    export let anchoredSocialHighlightsCount: number = null;
</script>

<div class={clsx("lindy-page-settings-toprght-inner", darkModeEnabled && "dark")}>
    <UIControl
        iconName="settings"
        tooltip="Unclutter settings"
        onClick={() => browser.runtime.sendMessage({ event: "openOptionsPage" })}
    />
    <BugReportControl {domain} {elementPickerModifier} />
    <ThemeControl {domain} {themeModifier} />
    <PrivateNotesControl {annotationsModifer} {overlayModifier} {smartHighlightsProxy} />
    <SocialHighlightsControl
        {annotationsModifer}
        {overlayModifier}
        {anchoredSocialHighlightsCount}
    />
</div>

<style global lang="postcss">
    .lindy-page-settings-toprght-inner {
        padding: 10px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        line-height: 1 !important;
        gap: 8px !important;
        width: 26px !important;
    }

    .lindy-page-settings-toprght-inner > * {
        all: revert !important;
    }
    .lindy-page-settings-toprght-inner > a {
        text-decoration: none !important;
        border: none !important;
    }
</style>
