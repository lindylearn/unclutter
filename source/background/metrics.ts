import {
    allowlistDomainOnManualActivationFeatureFlag,
    automaticallyEnabledFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
    enableBootUnclutterMessage,
    getFeatureFlag,
    isDevelopmentFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getAllCustomDomainSettings } from "../common/storage";

// Anonymously report usage events (if the user allowed it)
// See https://github.com/lindylearn/unclutter/blob/main/docs/metrics.md
export async function reportEvent(name, data = {}) {
    const metricsEnabled = await getFeatureFlag(
        collectAnonymousMetricsFeatureFlag
    );
    const isDev = await getFeatureFlag(isDevelopmentFeatureFlag);

    // Check if user allowed metrics reporting
    if (!metricsEnabled) {
        // only allowed event is on update, containing the new version
        if (name === "reportSettings") {
            await sendEvent(
                "reportSettings",
                {
                    version: data.version,
                    [collectAnonymousMetricsFeatureFlag]:
                        data[collectAnonymousMetricsFeatureFlag],
                },
                isDev
            );
        }

        return;
    }

    await sendEvent(name, data, isDev);
}

async function sendEvent(name, data, isDev) {
    try {
        const response = await fetch(`https://app.posthog.com/capture`, {
            method: "POST",
            body: JSON.stringify({
                api_key: "phc_BQHO9btvNLVEbFC4ihMIS8deK5T6P4d8EF75Ihvkfaw",
                distinct_id: distinctId,
                event: name,
                properties: {
                    $useragent: navigator.userAgent,
                    isDev,
                    ...data,
                },
            }),
        });
        if (!response.ok) {
            throw Error(JSON.stringify(response));
        }
    } catch (err) {
        console.error(`Error reporting metric:`, err);
    }
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
let pageViewEnableStartTime: Date;
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

let distinctId = null;
export async function startMetrics() {
    distinctId = await _getDistinctId();
}

async function _getDistinctId() {
    const config = await browser.storage.sync.get(["distinctId"]);
    if (config["distinctId"]) {
        return config["distinctId"];
    }

    const distinctId = crypto.getRandomValues(new Uint32Array(5)).join("");
    await browser.storage.sync.set({
        distinctId,
    });
    return distinctId;
}
