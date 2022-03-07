import browser from "webextension-polyfill";

browser.browserAction.onClicked.addListener(async (tab) => {
    // insert most recent JS. will be ignored if already injected
    await browser.tabs.executeScript(tab.id, {
        file: "content-script/index.js",
    });
    // start the page view
    await browser.tabs.sendMessage(tab.id, "togglePageView");
});

async function enableDevHotReload() {
    // unfortunately, this doesn't distinguish betweem 'web-ext run' and manual installs
    const { installType } = await browser.management.get(browser.runtime.id);
    if (installType !== "development") {
        return;
    }

    console.log("Enabling page view hot reload for the first tab");
    let tabs = await browser.tabs.query({});
    let tab = tabs[0];
    await browser.tabs.executeScript(tab.id, {
        file: "content-script/index.js",
    });
}
// should be disabled for releases
// enableDevHotReload();
