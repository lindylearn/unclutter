import {
    collectAnonymousMetricsFeatureFlag,
    getFeatureFlag,
} from "./featureFlags";

export async function reportEvent(name, data = {}) {
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
                url: `app://unclutter-extension/test`,
                name,
                props: data,
            }),
        });
        if (!response.ok) {
            console.error(`Error reporting metric:`, response);
        }
    } catch {}
}
