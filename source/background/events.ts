import { extensionSupportsUrl } from "../common/articleDetection";
import {
    collectAnonymousMetricsFeatureFlag,
    setFeatureFlag,
    showDebugInfo,
} from "../common/featureFlags";
import {
    reportDisablePageView,
    reportEnablePageView,
    reportSettings,
    startMetrics,
} from "../common/metrics";
import browser from "../common/polyfill";
import { fetchCss } from "./actions";
import { enableInTab, injectScript, togglePageViewMessage } from "./inject";
import { requestOptionalPermissions } from "./install";

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
    }

    return false;
});

// run on install, extension update, or browser update
browser.runtime.onInstalled.addListener(async ({ reason }) => {
    const extensionInfo = await browser.management.getSelf();
    const isNewInstall = reason === "install";
    const isDevelopment = extensionInfo.installType === "development";

    if (isDevelopment) {
        // disable metrics in dev mode
        await setFeatureFlag(collectAnonymousMetricsFeatureFlag, false);
        await setFeatureFlag(showDebugInfo, true);
    }

    // report aggregates on enabled extension features
    // this function should be executed every few days
    reportSettings(extensionInfo.version, isNewInstall, isDevelopment);
});

// initialize on every service worker start
function initializeServiceWorker() {
    startMetrics();
}
initializeServiceWorker();
