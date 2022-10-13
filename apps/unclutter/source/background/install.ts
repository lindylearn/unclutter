import browser, { getBrowserType } from "../common/polyfill";
import { injectScript } from "./inject";
import { reportEnablePageView } from "./metrics";

export function onNewInstall(version: string) {
    browser.tabs.create({
        url: "https://unclutter.lindylearn.io/welcome",
        active: true,
    });

    browser.runtime.setUninstallURL(
        "https://unclutter.lindylearn.io/uninstalled"
    );
}

// only run one time after each update
let installed = false;
export function setupWithPermissions() {
    if (installed) {
        return;
    }

    try {
        // test if already have permissions
        _installContextMenu();
        installed = true;
        return;
    } catch {}

    // need to request permissions as part of user action, so can't use async functions
    try {
        console.log("Requesting optional permissions ...");
        browser.permissions
            .request({
                permissions: ["contextMenus"],
            })
            .then(() => {
                _installContextMenu();
                installed = true;
            });
    } catch (err) {
        console.error(err);
    }
}

function _installContextMenu() {
    console.log("Registering context menu ...");

    createOrUpdateContextMenu("unclutter-link", {
        title: "Open Link with Unclutter",
        contexts: ["link"],
    });

    let context = "action";
    if (getBrowserType() === "firefox") {
        context = "browser_action";
    }
    // createOrUpdateContextMenu("open-library", {
    //     title: "Open Unclutter Library",
    //     contexts: [context],
    // });

    // throws error if no permission
    browser.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "unclutter-link") {
            browser.tabs.create({ url: info.linkUrl, active: true }, (tab) => {
                // need to wait until loaded, as have no permissions on new tab page
                setTimeout(() => {
                    injectScript(tab.id, "content-script/enhance.js");
                }, 1000);
                reportEnablePageView("contextMenu");
            });
        } else if (info.menuItemId === "open-library") {
            browser.tabs.create({
                url: "https://library.lindylearn.io/",
                active: true,
            });
        }
    });
}

function createOrUpdateContextMenu(id, menuOptions) {
    // try update first
    try {
        browser.contextMenus.update(id, menuOptions);
    } catch {}

    try {
        browser.contextMenus.create({ ...menuOptions, id });
    } catch {
        const _ = browser.runtime.lastError;
    }
}
