import { useEffect, useState } from "react";
import {
    enableAnnotationsFeatureFlag,
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
    const [personalAnnotationsEnabled, setPersonalAnnotationsEnabled] =
        useState(false);
    const [enableSocialAnnotations, setEnableSocialAnnotations] =
        useState(false);
    const [showAllSocialAnnotations, setShowAllSocialAnnotations] =
        useState(false);
    useEffect(() => {
        (async function () {
            const personalAnnotationsEnabled = await getFeatureFlag(
                enableAnnotationsFeatureFlag
            );

            const enableSocialAnnotations = await getFeatureFlag(
                enableSocialCommentsFeatureFlag
            );

            // batch changes
            setPersonalAnnotationsEnabled(personalAnnotationsEnabled);
            setEnableSocialAnnotations(enableSocialAnnotations);
        })();
    }, []);

    return {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        enableSocialAnnotations,
        showAllSocialAnnotations,
        setShowAllSocialAnnotations,
        setEnableSocialAnnotations,
    };
}
