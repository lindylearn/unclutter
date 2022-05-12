import { useEffect, useState } from "react";
import {
    enableAnnotationsFeatureFlag,
    getFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
    supportSocialAnnotations,
} from "../../common/featureFlags";
import { getRemoteFeatureFlag } from "../../content-script/messaging";

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
    const [showSocialAnnotations, setShowSocialAnnotations] = useState(false);
    useEffect(() => {
        (async function () {
            const personalAnnotationsEnabled = await getFeatureFlag(
                enableAnnotationsFeatureFlag
            );

            let showSocialAnnotations = false;
            const supportSocialFeature = await getRemoteFeatureFlag(
                supportSocialAnnotations
            );
            if (supportSocialFeature) {
                showSocialAnnotations = await getFeatureFlag(
                    showSocialAnnotationsDefaultFeatureFlag
                );
            }

            // batch state updates
            setPersonalAnnotationsEnabled(personalAnnotationsEnabled);
            setShowSocialAnnotations(showSocialAnnotations);
        })();
    }, []);

    return {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        showSocialAnnotations,
        setShowSocialAnnotations,
    };
}
