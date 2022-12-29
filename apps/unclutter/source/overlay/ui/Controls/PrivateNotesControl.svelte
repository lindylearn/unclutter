<script lang="ts">
    import {
        enableAnnotationsFeatureFlag,
        getFeatureFlag,
        setFeatureFlag,
    } from "../../../common/featureFlags";
    import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
    import type AnnotationsModifier from "../../../content-script/modifications/annotations/annotationsModifier";
    import type OverlayManager from "../../../content-script/modifications/overlay";
    import UiControl from "./UIControl.svelte";
    import type SmartHighlightsProxy from "../../../content-script/modifications/DOM/smartHighlightsProxy";

    export let annotationsModifer: AnnotationsModifier;
    export let smartHighlightsProxy: SmartHighlightsProxy;
    export let overlayModifier: OverlayManager;

    let privateNotesEnabled: boolean = true;
    getFeatureFlag(enableAnnotationsFeatureFlag).then((defaultEnabled) => {
        privateNotesEnabled = defaultEnabled;
    });

    function toggleEnabled() {
        privateNotesEnabled = !privateNotesEnabled;

        setFeatureFlag(enableAnnotationsFeatureFlag, privateNotesEnabled);

        annotationsModifer.setEnableAnnotations(privateNotesEnabled);
        overlayModifier.setEnableAnnotations(privateNotesEnabled);
        // smartHighlightsProxy.setEnableAnnotations(privateNotesEnabled);

        reportEventContentScript("toggleAnnotations", {
            newState: privateNotesEnabled,
        });
    }
</script>

<UiControl
    iconName={privateNotesEnabled ? "notes_enabled" : "notes_disabled"}
    tooltip={privateNotesEnabled ? "Click to disable highlights" : "Click to enable highlights"}
    onClick={toggleEnabled}
/>

<style lang="postcss">
</style>
