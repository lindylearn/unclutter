<script lang="ts">
    import { enableAnnotationsFeatureFlag } from "../../../../distribution/common/featureFlags";
    import {
        getFeatureFlag,
        setFeatureFlag,
    } from "../../../common/featureFlags";
    import { reportEventContentScript } from "../../../content-script/messaging";
    import AnnotationsModifier from "../../../content-script/modifications/annotations/annotationsModifier";
    import OverlayManager from "../../../content-script/modifications/overlay";
    import UiControl from "./UIControl.svelte";

    export let annotationsModifer: AnnotationsModifier;
    export let overlayModifier: OverlayManager;

    let privateNotesEnabled: boolean = true;
    getFeatureFlag(enableAnnotationsFeatureFlag).then((defaultEnabled) => {
        privateNotesEnabled = defaultEnabled;
    });

    function toggleEnabled() {
        privateNotesEnabled = !privateNotesEnabled;

        annotationsModifer.setEnableAnnotations(privateNotesEnabled);
        overlayModifier.setEnableAnnotations(privateNotesEnabled);
        setFeatureFlag(enableAnnotationsFeatureFlag, privateNotesEnabled);

        reportEventContentScript("toggleAnnotations", {
            newState: privateNotesEnabled,
        });
    }
</script>

<UiControl
    iconName={privateNotesEnabled ? "notes_enabled" : "notes_disabled"}
    tooltip={privateNotesEnabled
        ? "Click to enable private notes"
        : "Click to disable private notes"}
    onClick={toggleEnabled}
/>

<style lang="postcss">
</style>
