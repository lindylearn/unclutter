<script lang="ts">
    import browser from "../../common/polyfill";
    import { reportEventContentScript } from "../../content-script/messaging";
    import UIControl from "./UIControl.svelte";
    import PrivateNotesControl from "./PrivateNotesControl.svelte";
    import AnnotationsModifier from "../../content-script/modifications/annotations/annotationsModifier";
    import ThemeModifier from "../../content-script/modifications/CSSOM/theme";
    import OverlayManager from "../../content-script/modifications/overlay";
    import SocialHighlightsControl from "./SocialHighlightsControl.svelte";
    import ThemeControl from "./ThemeControl.svelte";

    export let domain: string;
    export let themeModifier: ThemeModifier;
    export let annotationsModifer: AnnotationsModifier;
    export let overlayModifier: OverlayManager;
    export let anchoredSocialHighlightsCount: number = null;
</script>

<UIControl
    iconName="settings"
    tooltip="Unclutter settings"
    onClick={() => browser.runtime.sendMessage({ event: "openOptionsPage" })}
/>
<UIControl
    iconName="bug"
    tooltip="Unclutter settings"
    onClick={() => reportEventContentScript("reportBugClick")}
/>
<ThemeControl {domain} {themeModifier} />
<PrivateNotesControl {annotationsModifer} {overlayModifier} />
<SocialHighlightsControl
    {annotationsModifer}
    {overlayModifier}
    {anchoredSocialHighlightsCount}
/>

<style global lang="postcss">
</style>
