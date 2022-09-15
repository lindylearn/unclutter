import {
    collectAnonymousMetricsFeatureFlag,
    getAllFeatureFlags,
    getFeatureFlag,
    isDevelopmentFeatureFlag,
    showFeedbackMessage,
    showLibraryGraph,
    showLibrarySignupFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getAllCustomDomainSettings } from "../common/storage2";
import { getInitialInstallVersion } from "../common/updateMessages";

// Anonymously report usage events (if the user allowed it)
// See https://github.com/lindylearn/unclutter/blob/main/docs/metrics.md
export async function reportEvent(name: string, data = {}) {
    const metricsEnabled = await getFeatureFlag(
        collectAnonymousMetricsFeatureFlag
    );
    const isDev = await getFeatureFlag(isDevelopmentFeatureFlag);
    if (isDev) {
        console.log(`Metric ${name}:`, data);
        return;
    }

    await sendEvent(name, data, isDev);
}

async function sendEvent(name, data, isDev) {
    const libraryUser = data["libraryUser"];
    if (libraryUser) {
        delete data["libraryUser"];
        data["$set"] = { distinctId };
    }

    try {
        await fetch(`https://app.posthog.com/capture`, {
            method: "POST",
            body: JSON.stringify({
                api_key: !libraryUser
                    ? "phc_BQHO9btvNLVEbFC4ihMIS8deK5T6P4d8EF75Ihvkfaw"
                    : "phc_fvlWmeHRjWGBHLXEmhtwx8vp5mSNHq63YbvKE1THr2r",
                distinct_id: libraryUser || distinctId,
                event: name,
                properties: {
                    $useragent: navigator.userAgent,
                    $current_url: "unclutter",
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
            version,
            initialInstallVersion: await getInitialInstallVersion(),
        },
    });
}

let pageViewEnableTrigger;
let pageViewEnableStartTime: Date;
export async function reportEnablePageView(
    trigger: string,
    socialCommentsCount?: number
) {
    reportEvent("enablePageview", { trigger, socialCommentsCount });

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
export async function startMetrics(isDev: boolean) {
    if (isDev) {
        distinctId = "test-user";
    } else {
        distinctId = await _getDistinctId();
    }
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

    const isDev = await getFeatureFlag(isDevelopmentFeatureFlag);
    if (isDev) {
        lastFeatureFlagFetch = new Date();
        cachedRemoteFeatureFlags = {
            [showLibrarySignupFlag]: true,
            [showFeedbackMessage]: true,
            [showLibraryGraph]: true,
        };
        return cachedRemoteFeatureFlags;
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
