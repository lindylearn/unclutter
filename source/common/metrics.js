import {
    allowlistDomainOnManualActivationFeatureFlag,
    automaticallyEnabledFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
    enableBootUnclutterMessage,
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
        // console.log(name, data);
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
        [enableBootUnclutterMessage]: await getFeatureFlag(
            enableBootUnclutterMessage
        ),
    };

    // count allowlisted and blocklisted domains
    // do not report the actual domains
    const lists = await getAllCustomDomainSettings();
    const domainSettings = {
        allowlistedCount: lists.allow.length,
        blocklistedCount: lists.deny.length,
    };

    reportEvent("reportSettings", {
        version,
        isNewInstall,
        ...featureFlagSettings,
        ...domainSettings,
    });
}

let pageViewEnableTrigger;
let pageViewEnableStartTime;
export async function reportEnablePageView(trigger) {
    reportEvent("enablePageview", { trigger });

    pageViewEnableTrigger = trigger;
    pageViewEnableStartTime = new Date();
}

export async function reportDisablePageView(trigger, pageHeightPx) {
    let activeSeconds;
    if (pageViewEnableStartTime) {
        activeSeconds = (new Date() - pageViewEnableStartTime) / 1000;
    }
    reportEvent("disablePageview", {
        trigger,
        enableTrigger: pageViewEnableTrigger,
        elapsedTime: _bucketMetric(secondsBuckets, activeSeconds),
        pageHeightPx: _bucketMetric(pageHeightPxBuckets, pageHeightPx),
    });
}

const secondsBuckets = [0, 5, 10, 15, 30, 60, 120, 240, 480, 960, 1920, 3840];
const pageHeightPxBuckets = [0, 500, 2000, 10000, 50000, 200000];
function _bucketMetric(buckets, value) {
    const matchingBuckets = buckets.filter((breakpoint) => value >= breakpoint);

    // return last bucket the numbers falls into
    return matchingBuckets[matchingBuckets.length - 1];
}
