// eslint-disable-next-line import/no-unassigned-import
import "./options-storage.js";

chrome.browserAction.onClicked.addListener((tab) => {
	chrome.tabs.insertCSS(tab.id, {
		file: "content.css",
	});
	chrome.tabs.executeScript(tab.id, {
		file: "content.js",
	});
});
