import browser from "../common/polyfill";
import fetchAndRewriteCss from "./rewriteCss";

// events from content scripts or popup view
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event === "enablePageView") {
        enableInTab(message.tabId);
    } else if (message.event === "disablePageView") {
        togglePageView(message.tabId);
    } else if (message.event === "requestEnhance") {
        // event sent from boot.js to inject additional functionality
        // browser apis are only available in scripts injected from background scripts or manifest.json
        console.log("boot.js requested injection into tab");
        _injectScript(sender.tab.id, "content-script/enhance.js");
    } else if (message.event === "rewriteCss") {
        fetchAndRewriteCss(message.params).then(sendResponse);
        return true;
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
        togglePageView(tabId);
    }
}

async function togglePageView(tabId) {
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
