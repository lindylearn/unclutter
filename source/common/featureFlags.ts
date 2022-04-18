import browser from "./polyfill";

export async function getFeatureFlag(key) {
    if (key in featureFlagLocalOverrides) {
        return featureFlagLocalOverrides[key];
    }

    const config = await browser.storage.sync.get([key]);
    return config[key] !== undefined ? config[key] : defaultFeatureFlags[key];
}
export async function setFeatureFlag(key, status) {
    await browser.storage.sync.set({ [key]: status });
}

export const automaticallyEnabledFeatureFlag = "automatically-enabled";
export const allowlistDomainOnManualActivationFeatureFlag =
    "allowlist-domain-manual-activation";
export const collectAnonymousMetricsFeatureFlag = "collect-anonymous-metrics";
export const enableBootUnclutterMessage = "enable-boot-unclutter-message";
export const isDevelopmentFeatureFlag = "is-dev";
export const showOutlineFeatureFlag = "show-outline";

export const dismissedFeedbackMessage = "dismissed-feedback-message";

// remote
export const showFeedbackMessage = "show-feedback-message";

export const defaultFeatureFlags = {
    [automaticallyEnabledFeatureFlag]: false,
    [allowlistDomainOnManualActivationFeatureFlag]: false,
    [collectAnonymousMetricsFeatureFlag]: true,
    [enableBootUnclutterMessage]: true,
    [isDevelopmentFeatureFlag]: false,
    [showOutlineFeatureFlag]: true,

    [dismissedFeedbackMessage]: false,
};

const featureFlagLocalOverrides = {
    [automaticallyEnabledFeatureFlag]: false, // deprecated
};
