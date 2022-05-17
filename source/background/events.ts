import { Runtime, Tabs } from "webextension-polyfill";
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
import { loadAnnotationCountsToMemory } from "./annotationCounts";
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
import { TabStateManager } from "./tabs";

const tabsManager = new TabStateManager();

// toggle page view on extension icon click
(chrome.action || browser.browserAction).onClicked.addListener(
    (tab: Tabs.Tab) => {
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

        tabsManager.checkIsArticle(tab.id, tab.url);

        // can only request permissions from user action
        requestOptionalPermissions();
    }
);

// handle events from content scripts
browser.runtime.onMessage.addListener(
    (message: any, sender: Runtime.MessageSender, sendResponse: () => void) => {
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
        } else if (message.event === "checkLocalAnnotationCount") {
            // trigger from boot.js because we don't have tabs permissions

            tabsManager
                .checkIsArticle(sender.tab.id, sender.url)
                .then(sendResponse);
            return true;
        } else if (message.event === "setSocialAnnotationsCount") {
            tabsManager.setSocialAnnotationsCount(sender.tab.id, message.count);
        }

        return false;
    }
);

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

    // show opt shortcut icon on mac
    browser.runtime.getPlatformInfo().then(({ os }) =>
        (chrome.action || browser.browserAction).setTitle({
            title: "Unclutter Current Article (⌥+C)",
        })
    );
});

// track tab changes to update extension icon badge
browser.tabs.onActivated.addListener((info: Tabs.OnActivatedActiveInfoType) =>
    tabsManager.onChangeActiveTab(info.tabId)
);
browser.tabs.onRemoved.addListener((tabId: number) =>
    tabsManager.onCloseTab(tabId)
);

// initialize on every service worker start
function initializeServiceWorker() {
    startMetrics();
    loadAnnotationCountsToMemory();
}
initializeServiceWorker();
