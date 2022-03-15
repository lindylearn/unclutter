import browser from "../common/polyfill";

// send enablePageView event to background script on extension icon click
browser.tabs
    .query({
        active: true,
        currentWindow: true,
    })
    .then((tabs) => {
        browser.runtime.sendMessage(null, {
            event: "enablePageView",
            tabId: tabs[0].id,
        });
    });
