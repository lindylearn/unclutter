import browser from "../common/polyfill";
import fetchAndRewriteCss from "./rewriteCss";

// when extension icon clicked, inject annotations view into active tab
(chrome.action || browser.browserAction).onClicked.addListener(async (tab) => {
    let alreadyInjected = false;
    try {
        alreadyInjected = await browser.tabs.sendMessage(tab.id, "ping");
        console.log("Got ping response from open tab:", alreadyInjected);
    } catch {
        // throws error if message listener not loaded
        // in that case, just load the content script
    }
    if (!alreadyInjected) {
        console.log("Content script not loaded in active tab, injecting it...");
        await _injectScript(tab.id, "content-script/enhance.js");
    }

    // toggle the page view
    await browser.tabs.sendMessage(tab.id, "togglePageView");
});

// events from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event === "requestEnhance") {
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
            file: filePath,
        });
    }
}
