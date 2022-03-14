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
        await _executeScript(tab.id, "content-script/boot.js");
    }

    // toggle the page view
    await browser.tabs.sendMessage(tab.id, "togglePageView");
});

async function _executeScript(tabId, filePath) {
    // different calls for v2 and v3 manifest
    if (chrome?.scripting) {
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

// events from content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if ((message.event = "rewriteCss")) {
        fetchAndRewriteCss(message.params).then(sendResponse);
        return true;
    }
    return false;
});
