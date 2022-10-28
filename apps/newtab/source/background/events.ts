import {
    getUnclutterExtensionId,
    getUnclutterVersion,
    reportEventContentScript,
} from "@unclutter/library-components/dist/common";
import browser from "../common/polyfill";

// run on install, extension update, or browser update
browser.runtime.onInstalled.addListener(async () => {
    const extensionInfo = await browser.management.getSelf();

    reportEventContentScript(
        "reportSettingsNewTab",
        { version: extensionInfo.version },
        getUnclutterExtensionId()
    );
});

// initialize on every service worker start
async function initializeServiceWorker() {
    const unclutterVersion = await getUnclutterVersion(getUnclutterExtensionId());
    console.log(`Found Unclutter extension v${unclutterVersion}`);
}
initializeServiceWorker();
