import {
    allowlistDomainOnManualActivationFeatureFlag,
    getFeatureFlag,
} from "../common/featureFlags";
import { reportEvent } from "../common/metrics";
import browser from "../common/polyfill";
import {
    getUserSettingForDomain,
    setUserSettingsForDomain,
} from "../common/storage";
import { getDomainFrom } from "../common/util";
import fetchAndRewriteCss from "./rewriteCss";

// toggle page view on extension icon click
(chrome.action || browser.browserAction).onClicked.addListener(async (tab) => {
    const didEnable = await enableInTab(tab.id);
    if (!didEnable) {
        // already active, so disable
        togglePageViewMessage(tab.id);

        reportEvent("disablePageview", { trigger: "extensionIcon" });
    }

    if (didEnable) {
        // if enabled, allowlist current domain if user manually actives extension
        if (
            await getFeatureFlag(allowlistDomainOnManualActivationFeatureFlag)
        ) {
            const domain = getDomainFrom(new URL(tab.url));
            const currentDomainSetting = await getUserSettingForDomain(domain);
            if (currentDomainSetting === null) {
                setUserSettingsForDomain(domain, "allow");
            }
        }

        reportEvent("enablePageview", { trigger: "manual" });
    }
});

// events from content scripts or popup view
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event === "enablePageView") {
        enableInTab(message.tabId);
    } else if (message.event === "disablePageView") {
        togglePageViewMessage(message.tabId);
    } else if (message.event === "requestEnhance") {
        // event sent from boot.js to inject additional functionality
        // browser apis are only available in scripts injected from background scripts or manifest.json
        console.log("boot.js requested injection into tab");
        _injectScript(sender.tab.id, "content-script/enhance.js");

        const domain = getDomainFrom(new URL(sender.tab.url));
        getUserSettingForDomain(domain).then((userDomainSetting) =>
            reportEvent("enablePageview", {
                trigger:
                    userDomainSetting === "allow" ? "allowlisted" : "automatic",
            })
        );
    } else if (message.event === "rewriteCss") {
        fetchAndRewriteCss(message.params).then(sendResponse);
        return true;
    } else if (message.event === "openOptionsPage") {
        chrome.runtime.openOptionsPage();
    }

    return false;
});

async function enableInTab(tabId) {
    let pageViewEnabled = false;
    try {
        const response = await browser.tabs.sendMessage(tabId, {
            event: "ping",
        });
        pageViewEnabled = response?.pageViewEnabled;
        console.log("Got ping response from open tab:", response);
    } catch (err) {
        // throws error if message listener not loaded

        // in that case, just load the content script
        console.log("Content script not loaded in active tab, injecting it...");
        await _injectScript(tabId, "content-script/enhance.js");
    }

    // toggle the page view if not active
    if (!pageViewEnabled) {
        togglePageViewMessage(tabId);
        return true;
    }
    return false;
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
