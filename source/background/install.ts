import { reportEnablePageView } from "source/background/metrics";
import browser from "../common/polyfill";
import { injectScript } from "./inject";

// only run one time after each update
let requestedOptionalPermissions = false;
export function requestOptionalPermissions() {
    if (requestedOptionalPermissions) {
        return;
    }
    requestedOptionalPermissions = true;

    console.log("Requesting optional permissions ...");

    // need to request permissions as part of user action, so can't use async functions
    try {
        browser.permissions
            .request({
                permissions: ["contextMenus"],
            })
            .then(() => {
                _installContextMenu();
            });
    } catch {
        try {
            _installContextMenu();
        } catch {}
    }
}

async function _installContextMenu() {
    console.log("Registering context menu ...");

    const menuOptions = {
        title: "Open Link with Unclutter",
        contexts: ["link"],
    };

    try {
        browser.contextMenus.create({ ...menuOptions, id: "unclutter-link" });
    } catch {
        console.log(runtime.lastError);
    }
    browser.contextMenus.update("unclutter-link", menuOptions);

    browser.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "unclutter-link") {
            browser.tabs.create({ url: info.linkUrl, active: true }, (tab) => {
                // need to wait until loaded, as have no permissions on new tab page
                setTimeout(() => {
                    injectScript(tab.id, "content-script/enhance.js");
                }, 1000);
                reportEnablePageView("contextMenu");
            });
        }
    });
}
