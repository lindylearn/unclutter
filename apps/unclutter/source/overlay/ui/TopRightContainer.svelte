<script lang="ts">
    import browser from "../../common/polyfill";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common";
    import UIControl from "./Controls/UIControl.svelte";
    import PrivateNotesControl from "./Controls/PrivateNotesControl.svelte";
    import AnnotationsModifier from "../../content-script/modifications/annotations/annotationsModifier";
    import ThemeModifier from "../../content-script/modifications/CSSOM/theme";
    import OverlayManager from "../../content-script/modifications/overlay";
    import SocialHighlightsControl from "./Controls/SocialHighlightsControl.svelte";
    import ThemeControl from "./Controls/ThemeControl.svelte";
    import BugReportControl from "./Controls/BugReportControl.svelte";
    import TextContainerModifier from "../../content-script/modifications/DOM/textContainer";
    import ElementPickerModifier from "../../content-script/modifications/elementPicker";

    export let themeModifier: ThemeModifier;
    export let annotationsModifer: AnnotationsModifier;
    export let overlayModifier: OverlayManager;
    export let textContainerModifier: TextContainerModifier;
    export let elementPickerModifier: ElementPickerModifier;

    export let domain: string;
    export let anchoredSocialHighlightsCount: number = null;
</script>

<UIControl
    iconName="settings"
    tooltip="Unclutter settings"
    onClick={() => browser.runtime.sendMessage({ event: "openOptionsPage" })}
/>
<BugReportControl {domain} {elementPickerModifier} />
<ThemeControl {domain} {themeModifier} />
<PrivateNotesControl {annotationsModifer} {overlayModifier} />
<SocialHighlightsControl {annotationsModifer} {overlayModifier} {anchoredSocialHighlightsCount} />

<style global lang="postcss">
    .lindy-page-settings-toprght > * {
        all: revert !important;
    }
    .lindy-page-settings-toprght > a {
        text-decoration: none !important;
        border: none !important;
    }
</style>
