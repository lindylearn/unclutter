import {
    allowlistDomainOnManualActivationFeatureFlag,
    automaticallyEnabledFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
    getFeatureFlag,
} from "./featureFlags";
import { getAllCustomDomainSettings } from "./storage";

// Anonymously report usage events (if the user allowed it)
// See https://github.com/lindylearn/unclutter/blob/main/docs/metrics.md
export async function reportEvent(name, data = {}, isDev = false) {
    // Check if user allowed metrics reporting
    const metricsEnabled = await getFeatureFlag(
        collectAnonymousMetricsFeatureFlag
    );
    if (!metricsEnabled) {
        return;
    }

    try {
        // See https://plausible.io/docs/events-api
        const response = await fetch(`https://plausible.io/api/event`, {
            method: "POST",
            headers: {
                "User-Agent": navigator.userAgent,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                domain: "unclutter-extension",
                url: `app://unclutter-extension/${isDev ? "test" : ""}`,
                name,
                props: data,
            }),
        });
        if (!response.ok) {
            console.error(`Error reporting metric:`, response);
        }
    } catch {}
}

// Report anonymous aggregates on enabled extension features (if the user allowed it)
export async function reportSettings(version, isNewInstall) {
    // true / false state of enabled features
    const featureFlagSettings = {
        [automaticallyEnabledFeatureFlag]: await getFeatureFlag(
            automaticallyEnabledFeatureFlag
        ),
        [allowlistDomainOnManualActivationFeatureFlag]: await getFeatureFlag(
            allowlistDomainOnManualActivationFeatureFlag
        ),
        [collectAnonymousMetricsFeatureFlag]: await getFeatureFlag(
            collectAnonymousMetricsFeatureFlag
        ),
    };

    // count allowlisted and blocklisted domains
    // do not report the actual domains
    const lists = await getAllCustomDomainSettings();
    const domainSettings = {
        allowlistedCount: lists.allow.length,
        blocklistedCount: lists.deny.length,
        customThemeCount: Object.keys(lists.themes).length,
    };

    reportEvent("reportSettings", {
        version,
        isNewInstall,
        ...featureFlagSettings,
        ...domainSettings,
    });
}
