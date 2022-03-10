import browser from "webextension-polyfill";

// when extension icon clicked, inject annotations view into active tab
browser.action.onClicked.addListener(async (tab) => {
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
        await browser.scripting.executeScript({
            target: {
                tabId: tab.id,
            },
            files: ["content-script/index.js"],
        });
    }

    // toggle the page view
    await browser.tabs.sendMessage(tab.id, "togglePageView");
});
