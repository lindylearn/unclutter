import browser from 'webextension-polyfill';

browser.browserAction.onClicked.addListener(async (tab) => {
	// insert most recent JS. will be ignored if already injected
	await browser.tabs.executeScript(tab.id, {
		file: 'content-script/index.js',
	});
	// start the page view
	await browser.tabs.sendMessage(tab.id, 'togglePageView');
});

async function hotReload() {
	console.log('hotreload');
	let tabs = await browser.tabs.query({});
	let tab = tabs[0];
	await browser.tabs.executeScript(tab.id, {
		file: 'content-script/index.js',
	});
}

browser.runtime.onStartup.addListener(hotReload);
hotReload();
