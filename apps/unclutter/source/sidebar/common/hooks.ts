import { useEffect, useState } from "react";
import {
    enableAnnotationsFeatureFlag,
    enableExperimentalFeatures,
    enableSocialCommentsFeatureFlag,
    getFeatureFlag,
} from "../../common/featureFlags";

export function useFeatureFlag(featureFlag: string): boolean {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        (async function () {
            const enabled = await getFeatureFlag(featureFlag);
            setEnabled(enabled);
        })();
    }, []);

    return enabled;
}

export function useAnnotationSettings() {
    const [personalAnnotationsEnabled, setPersonalAnnotationsEnabled] = useState(false);
    const [enableSocialAnnotations, setEnableSocialAnnotations] = useState(false);
    const [showAllSocialAnnotations, setShowAllSocialAnnotations] = useState(false);
    const [experimentsEnabled, setExperimentsEnabled] = useState(false);
    useEffect(() => {
        (async function () {
            const personalAnnotationsEnabled = await getFeatureFlag(enableAnnotationsFeatureFlag);
            const enableSocialAnnotations = await getFeatureFlag(enableSocialCommentsFeatureFlag);
            const experimentsEnabled = await getFeatureFlag(enableExperimentalFeatures);

            // batch changes
            setPersonalAnnotationsEnabled(personalAnnotationsEnabled);
            setEnableSocialAnnotations(enableSocialAnnotations);
            setExperimentsEnabled(experimentsEnabled);
        })();
    }, []);

    return {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        enableSocialAnnotations,
        showAllSocialAnnotations,
        setShowAllSocialAnnotations,
        setEnableSocialAnnotations,
        experimentsEnabled,
    };
}
