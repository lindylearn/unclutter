import React from "react";
import {
    enableAnnotationsFeatureFlag,
    getFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
    supportSocialAnnotations,
} from "../../common/featureFlags";
import { getRemoteFeatureFlag } from "../../content-script/messaging";

export function useFeatureFlag(featureFlag: string) {
    const [enabled, setEnabled] = React.useState(false);
    React.useEffect(() => {
        (async function () {
            const enabled = await getFeatureFlag(featureFlag);
            setEnabled(enabled);
        })();
    }, []);

    return enabled;
}

export function useAnnotationSettings() {
    const [personalAnnotationsEnabled, setPersonalAnnotationsEnabled] =
        React.useState(false);
    const [showSocialAnnotations, setShowSocialAnnotations] =
        React.useState(false);
    React.useEffect(() => {
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
