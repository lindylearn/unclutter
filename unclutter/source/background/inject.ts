import browser from "../common/polyfill";

export async function enableInTab(tabId) {
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
        await injectScript(tabId, "content-script/enhance.js");
        return true;
    }
}

export async function togglePageViewMessage(tabId) {
    await browser.tabs.sendMessage(tabId, { event: "togglePageView" });
}

// inject a content script
export async function injectScript(tabId, filePath) {
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
