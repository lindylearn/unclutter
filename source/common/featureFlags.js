import browser from "./polyfill";

export async function getFeatureFlag(key) {
    if (key in featureFlagOverrides) {
        return featureFlagOverrides[key];
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
export const defaultFeatureFlags = {
    [automaticallyEnabledFeatureFlag]: false,
    [allowlistDomainOnManualActivationFeatureFlag]: false,
    [collectAnonymousMetricsFeatureFlag]: true,
    [enableBootUnclutterMessage]: true, // TODO enable
    [isDevelopmentFeatureFlag]: false,
};

export const featureFlagOverrides = {
    [automaticallyEnabledFeatureFlag]: false, // deprecate for now
};
