import browser from "webextension-polyfill";

// when extension icon clicked, inject annotations view into active tab
browser.action.onClicked.addListener(async (tab) => {
    // insert most recent JS. will be ignored if already injected
    await browser.scripting.executeScript({
        target: {
            tabId: tab.id,
        },
        files: ["content-script/index.js"],
    });
    // start the page view
    await browser.tabs.sendMessage(tab.id, "togglePageView");
});

// Automatically reload the first tab when the extension is reloaded.
// Additionally needs the "tabs" and "management" permissions not enabled for prod.
async function enableDevHotReload() {
    // unfortunately, this doesn't distinguish betweem 'web-ext run' and manual installs
    const { installType } = await browser.management.get(browser.runtime.id);
    if (installType !== "development") {
        return;
    }

    console.log("Enabling page view hot reload for the first tab");
    let tabs = await browser.tabs.query({});
    let tab = tabs[0];
    await browser.scripting.executeScript({
        target: {
            tabId: tab.id,
        },
        files: ["content-script/index.js"],
    });
}
// must be disabled for releases
// enableDevHotReload();
