import {
    collectAnonymousMetricsFeatureFlag,
    getAllFeatureFlags,
    getFeatureFlag,
    isDevelopmentFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getAllCustomDomainSettings } from "../common/storage2";

// Anonymously report usage events (if the user allowed it)
// See https://github.com/lindylearn/unclutter/blob/main/docs/metrics.md
export async function reportEvent(name, data = {}) {
    const metricsEnabled = await getFeatureFlag(
        collectAnonymousMetricsFeatureFlag
    );
    const isDev = await getFeatureFlag(isDevelopmentFeatureFlag);

    // Check if user allowed metrics reporting
    if (!metricsEnabled) {
        // only allowed event is update notification
        if (name !== "reportSettings") {
            return;
        }
    }

    await sendEvent(name, data, isDev);
}

async function sendEvent(name, data, isDev) {
    try {
        await fetch(`https://plausible.io/api/event`, {
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
        await fetch(`https://app.posthog.com/capture`, {
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
    } catch (err) {
        console.error(`Error reporting metric:`, err);
    }
}

// Report anonymous aggregates on enabled extension features (if the user allowed it)
export async function reportSettings(version, isNewInstall) {
    // true / false state of enabled features
    const featureFlagSettings = await getAllFeatureFlags();

    // count allowlisted and blocklisted domains
    // do not report the actual domains
    const lists = await getAllCustomDomainSettings();
    const domainSettings = {
        allowlistedCount: lists.allow.length,
        blocklistedCount: lists.deny.length,
    };

    const isDev = await getFeatureFlag(isDevelopmentFeatureFlag);

    reportEvent("reportSettings", {
        version,
        isNewInstall,
        ...featureFlagSettings,
        ...domainSettings,
        $set: {
            ...featureFlagSettings,
            isDev,
        },
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

// roll out some features gradually for testing
let cachedRemoteFeatureFlags = null;
let lastFeatureFlagFetch: Date;
export async function getRemoteFeatureFlags() {
    if (cachedRemoteFeatureFlags !== null) {
        const fetchSecondsAgo = (new Date() - lastFeatureFlagFetch) / 1000;
        // use for 15 minutes
        if (fetchSecondsAgo < 60 * 15) {
            return cachedRemoteFeatureFlags;
        }
    }

    try {
        const response = await fetch(`https://app.posthog.com/decide`, {
            method: "POST",
            body: JSON.stringify({
                api_key: "phc_BQHO9btvNLVEbFC4ihMIS8deK5T6P4d8EF75Ihvkfaw",
                distinct_id: distinctId,
            }),
        });

        const enabledFeatureFlags: string[] = (await response.json())
            .featureFlags;
        cachedRemoteFeatureFlags = enabledFeatureFlags.reduce(
            (obj, flag) => ({ ...obj, [flag]: true }),
            {}
        );
        lastFeatureFlagFetch = new Date();

        return cachedRemoteFeatureFlags;
    } catch (err) {
        console.error(`Error getting remote feature flags:`, err);
        return {};
    }
}
