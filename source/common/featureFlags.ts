import browser from "./polyfill";

export async function getFeatureFlag(key) {
    if (key in featureFlagLocalOverrides) {
        return featureFlagLocalOverrides[key];
    }

    const config = await browser.storage.sync.get([key]);
    return (
        (config[key] !== undefined ? config[key] : defaultFeatureFlags[key]) ||
        false
    );
}
export async function setFeatureFlag(key, status) {
    await browser.storage.sync.set({ [key]: status });
}

export async function getAllFeatureFlags() {
    const reportedFlags = [
        automaticallyEnabledFeatureFlag,
        allowlistDomainOnManualActivationFeatureFlag,
        collectAnonymousMetricsFeatureFlag,
        enableBootUnclutterMessage,
        showOutlineFeatureFlag,
        hypothesisSyncFeatureFlag,
        showSocialAnnotationsDefaultFeatureFlag,
        dismissedFeedbackMessage,
    ];

    // does not include defaultFeatureFlags
    const config = await browser.storage.sync.get(reportedFlags);

    return config;
}

export const automaticallyEnabledFeatureFlag = "automatically-enabled";
export const allowlistDomainOnManualActivationFeatureFlag =
    "allowlist-domain-manual-activation";
export const collectAnonymousMetricsFeatureFlag = "collect-anonymous-metrics";
export const enableBootUnclutterMessage = "enable-boot-unclutter-message";
export const isDevelopmentFeatureFlag = "is-dev";
export const showOutlineFeatureFlag = "show-outline";

export const enableAnnotationsFeatureFlag = "annotations-enabled";
export const hypothesisSyncFeatureFlag = "hypothesis-sync";
export const showSocialAnnotationsDefaultFeatureFlag =
    "social-annotations-default-enabled";

export const dismissedFeedbackMessage = "dismissed-feedback-message";

// remote
export const showFeedbackMessage = "show-feedback-message";
export const supportSocialAnnotations = "support-social-annotations";

export const defaultFeatureFlags = {
    [automaticallyEnabledFeatureFlag]: false,
    [allowlistDomainOnManualActivationFeatureFlag]: false,
    [collectAnonymousMetricsFeatureFlag]: true,
    [enableBootUnclutterMessage]: true,
    [isDevelopmentFeatureFlag]: false,
    [showOutlineFeatureFlag]: true,
    [enableAnnotationsFeatureFlag]: true,
    [showSocialAnnotationsDefaultFeatureFlag]: true,

    [dismissedFeedbackMessage]: false,
};

const featureFlagLocalOverrides = {
    [automaticallyEnabledFeatureFlag]: false, // deprecated
};
