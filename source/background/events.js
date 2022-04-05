import { extensionSupportsUrl } from "../common/articleDetection";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
    enableBootUnclutterMessage,
    getFeatureFlag,
    setFeatureFlag,
} from "../common/featureFlags";
import {
    reportDisablePageView,
    reportEnablePageView,
    reportSettings,
} from "../common/metrics";
import browser from "../common/polyfill";
import {
    getUserSettingForDomain,
    setUserSettingsForDomain,
} from "../common/storage";
import { getDomainFrom } from "../common/util";

// toggle page view on extension icon click
(chrome.action || browser.browserAction).onClicked.addListener(async (tab) => {
    const url = new URL(tab.url);
    const domain = getDomainFrom(url);

    if (!extensionSupportsUrl(url)) {
        // ideally show some error message here
        return;
    }

    const didEnable = await enableInTab(tab.id);
    if (didEnable) {
        // if enabled, allowlist current domain if user manually actives extension
        if (
            await getFeatureFlag(allowlistDomainOnManualActivationFeatureFlag)
        ) {
            const currentDomainSetting = await getUserSettingForDomain(domain);
            if (currentDomainSetting === null) {
                setUserSettingsForDomain(domain, "allow");
            }
        }

        reportEnablePageView("manual");
    } else {
        // already active, so disable
        togglePageViewMessage(tab.id);
    }
});

// events from content scripts or popup view
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`Received '${message.event}' message:`, message);

    if (message.event === "disabledPageView") {
        reportDisablePageView(message.trigger, message.pageHeightPx);
    } else if (message.event === "requestEnhance") {
        // event sent from boot.js to inject additional functionality
        // browser apis are only available in scripts injected from background scripts or manifest.json
        console.log("boot.js requested injection into tab");
        _injectScript(sender.tab.id, "content-script/enhance.js");

        const domain = getDomainFrom(new URL(sender.tab.url));
        getUserSettingForDomain(domain).then((userDomainSetting) =>
            reportEnablePageView(
                userDomainSetting === "allow" ? "allowlisted" : "automatic"
            )
        );
    } else if (message.event === "openOptionsPage") {
        chrome.runtime.openOptionsPage();
    } else if (message.event === "fetchCss") {
        fetchCss(message.url).then(sendResponse);
        return true;
    }

    return false;
});

async function fetchCss(url) {
    try {
        const response = await fetch(url);
        const cssText = await response.text();

        return {
            status: "success",
            cssText,
        };
    } catch (err) {
        return {
            status: "error",
            err,
        };
    }
}

// run on install, extension update, or browser update
browser.runtime.onInstalled.addListener(async ({ reason }) => {
    const extensionInfo = await browser.management.getSelf();
    const isNewInstall = reason === "install";
    const isDevelopment = extensionInfo.installType === "development";

    if (isDevelopment) {
        // disable metrics in dev mode
        await setFeatureFlag(collectAnonymousMetricsFeatureFlag, false);
        await setFeatureFlag(enableBootUnclutterMessage, true);
    }

    // report aggregates on enabled extension features
    // this function should be executed every few days
    reportSettings(extensionInfo.version, isNewInstall);
});

async function enableInTab(tabId) {
    let pageViewEnabled = false;
    try {
        const response = await browser.tabs.sendMessage(tabId, {
            event: "ping",
        });
        pageViewEnabled = response?.pageViewEnabled;
        console.log("Got ping response from open tab:", response);

        // toggle the page view if not active
        if (!pageViewEnabled) {
            togglePageViewMessage(tabId);
            return true;
        }
        return false;
    } catch (err) {
        // throws error if message listener not loaded

        // in that case, just load the content script
        console.log("Injecting enhance.js...");
        await _injectScript(tabId, "content-script/enhance.js");
        return true;
    }
}

async function togglePageViewMessage(tabId) {
    await browser.tabs.sendMessage(tabId, { event: "togglePageView" });
}

// inject a content script
async function _injectScript(tabId, filePath) {
    // different calls for v2 and v3 manifest
    if (chrome?.scripting) {
        // default runAt=document_idle
        await chrome.scripting.executeScript({
            target: { tabId },
            files: [filePath],
        });
    } else {
        await browser.tabs.executeScript(tabId, {
            file: browser.runtime.getURL(filePath),
        });
    }
}
