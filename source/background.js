import browser from "webextension-polyfill";

browser.browserAction.onClicked.addListener(async (tab) => {
	await browser.tabs.executeScript(tab.id, {
		file: "content.js",
	});
	await browser.tabs.insertCSS(tab.id, {
		file: "content.css",
	});
	await browser.tabs.sendMessage(tab.id, "togglePageView");
});
