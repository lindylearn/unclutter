import browser from "./polyfill";

export async function getFeatureFlag(key) {
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
export const defaultFeatureFlags = {
    [automaticallyEnabledFeatureFlag]: false,
    [allowlistDomainOnManualActivationFeatureFlag]: true,
    [collectAnonymousMetricsFeatureFlag]: true, //!isDevMode(),
};

// untested in firefox
export function isDevMode() {
    return !("update_url" in browser.runtime.getManifest());
}
