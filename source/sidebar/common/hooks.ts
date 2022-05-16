import { useEffect, useState } from "react";
import {
    enableAnnotationsFeatureFlag,
    enableSocialDotsFeatureFlag,
    getFeatureFlag,
    showAllSocialCommentsFeatureFlag,
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
    const [enableSocialAnnotations, setEnableSocialAnnotations] =
        useState(false);
    const [showAllSocialAnnotations, setShowAllSocialAnnotations] =
        useState(false);
    useEffect(() => {
        (async function () {
            const personalAnnotationsEnabled = await getFeatureFlag(
                enableAnnotationsFeatureFlag
            );
            setPersonalAnnotationsEnabled(personalAnnotationsEnabled);

            const supportSocialFeature = await getRemoteFeatureFlag(
                supportSocialAnnotations
            );
            if (supportSocialFeature) {
                if (await getFeatureFlag(showAllSocialCommentsFeatureFlag)) {
                    setEnableSocialAnnotations(true);
                    setShowAllSocialAnnotations(true);
                } else if (await getFeatureFlag(enableSocialDotsFeatureFlag)) {
                    setEnableSocialAnnotations(true);
                }
            }
        })();
    }, []);

    return {
        personalAnnotationsEnabled,
        setPersonalAnnotationsEnabled,
        enableSocialAnnotations,
        showAllSocialAnnotations,
        setShowAllSocialAnnotations,
    };
}
