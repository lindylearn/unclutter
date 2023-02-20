import {
    getUnclutterVersion,
    reportEventContentScript,
} from "@unclutter/library-components/dist/common";
import type { Runtime } from "webextension-polyfill";
import browser from "../common/polyfill";

// run on install, extension update, or browser update
browser.runtime.onInstalled.addListener(async () => {
    const extensionInfo = await browser.management.getSelf();

    reportEventContentScript("reportSettingsNewTab", { version: extensionInfo.version });
});

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onMessageExternal.addListener(handleMessage);
function handleMessage(
    message: any,
    sender: Runtime.MessageSender,
    sendResponse: (...args: any[]) => void
) {
    if (message.event === "getNewTabVersion") {
        browser.management.getSelf().then((extensionInfo) => sendResponse(extensionInfo.version));
        return true;
    }
}

// initialize on every service worker start
async function initializeServiceWorker() {
    const unclutterVersion = await getUnclutterVersion();
    console.log(`Found Unclutter extension v${unclutterVersion}`);
}
initializeServiceWorker();
