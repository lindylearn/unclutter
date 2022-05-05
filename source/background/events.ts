import { extensionSupportsUrl } from "../common/articleDetection";
import {
    collectAnonymousMetricsFeatureFlag,
    isDevelopmentFeatureFlag,
    setFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { saveInitialInstallVersionIfMissing } from "../overlay/outline/updateMessages";
import { migrateAnnotationStorage } from "../sidebar/common/local";
import { fetchCss } from "./actions";
import { enableInTab, injectScript, togglePageViewMessage } from "./inject";
import { onNewInstall, requestOptionalPermissions } from "./install";
import {
    getRemoteFeatureFlags,
    reportDisablePageView,
    reportEnablePageView,
    reportEvent,
    reportSettings,
    startMetrics,
} from "./metrics";

// toggle page view on extension icon click
(chrome.action || browser.browserAction).onClicked.addListener((tab) => {
    const url = new URL(tab.url);

    if (!extensionSupportsUrl(url)) {
        // ideally show some error message here
        return;
    }

    enableInTab(tab.id).then((didEnable) => {
        if (didEnable) {
            reportEnablePageView("manual");
        } else {
            // already active, so disable
            togglePageViewMessage(tab.id);
        }
    });

    // can only request permissions from user action
    requestOptionalPermissions();
});

// handle events from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Received '${message.event}' message:`, message);

    if (message.event === "disabledPageView") {
        reportDisablePageView(message.trigger, message.pageHeightPx);
    } else if (message.event === "requestEnhance") {
        // event sent from boot.js to inject additional functionality
        // browser apis are only available in scripts injected from background scripts or manifest.json
        console.log("boot.js requested injection into tab");
        injectScript(sender.tab.id, "content-script/enhance.js");

        reportEnablePageView(message.trigger);
    } else if (message.event === "openOptionsPage") {
        browser.runtime.openOptionsPage();
    } else if (message.event === "fetchCss") {
        fetchCss(message.url).then(sendResponse);
        return true;
    } else if (message.event === "reportEvent") {
        reportEvent(message.name, message.data);
    } else if (message.event === "getRemoteFeatureFlags") {
        getRemoteFeatureFlags().then(sendResponse);
        return true;
    }

    return false;
});

// run on install, extension update, or browser update
browser.runtime.onInstalled.addListener(async ({ reason }) => {
    const extensionInfo = await browser.management.getSelf();
    const isNewInstall = reason === "install";
    const isDev = extensionInfo.installType === "development";

    if (isDev) {
        // disable metrics in dev mode
        await setFeatureFlag(collectAnonymousMetricsFeatureFlag, false);
        await setFeatureFlag(isDevelopmentFeatureFlag, true);
    }

    // report aggregates on enabled extension features
    // this function should be executed every few days
    reportSettings(extensionInfo.version, isNewInstall);

    if (isNewInstall && !isDev) {
        onNewInstall(extensionInfo.version);
    }

    saveInitialInstallVersionIfMissing(extensionInfo.version);
    await migrateAnnotationStorage();

    browser.runtime.getPlatformInfo().then(({ os }) =>
        (chrome.action || browser.browserAction).setTitle({
            title: "Unclutter Current Article (⌥+C)",
        })
    );
});

// initialize on every service worker start
function initializeServiceWorker() {
    startMetrics();
}
initializeServiceWorker();

// browser.action.setBadgeBackgroundColor({ color: "#edd75b" });
// browser.action.setBadgeText({ text: "5" });
