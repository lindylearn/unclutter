import browser, { getBrowserType } from "../common/polyfill";
import { injectScript } from "./inject";
import { reportEnablePageView } from "./metrics";
import type { Alarms } from "webextension-polyfill";
import { refreshLibraryFeeds, syncPull } from "./library/library";

export function onNewInstall(version: string) {
    browser.tabs.create({
        url: "https://unclutter.lindylearn.io/welcome",
        active: true,
    });

    browser.runtime.setUninstallURL("https://unclutter.lindylearn.io/uninstalled");
}

// only run one time after each update
let installed = false;
export function setupWithPermissions() {
    if (installed) {
        return;
    }

    try {
        // test if already have permissions
        installContextMenu();
        installAlarms();
        installed = true;
        return;
    } catch {}

    // need to request permissions as part of user action, so can't use async functions
    try {
        console.log("Requesting optional permissions ...");
        browser.permissions
            .request({
                permissions: ["contextMenus", "alarms"],
            })
            .then(() => {
                installContextMenu();
                installAlarms();
                installed = true;
            });
    } catch (err) {
        console.error(err);
    }
}

function installContextMenu() {
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

function installAlarms() {
    console.log("Registering periodic alarms...");

    // updates alarm if already exists
    browser.alarms.create("unclutter-library-feed-refresh", {
        // every 12 hours
        delayInMinutes: 60 * 12,
        periodInMinutes: 60 * 12,
    } as Alarms.CreateAlarmInfoType);
    // updates alarm if already exists
    browser.alarms.create("unclutter-library-sync-pull", {
        // every 6 hours
        delayInMinutes: 60 * 6,
        periodInMinutes: 60 * 6,
    } as Alarms.CreateAlarmInfoType);

    createAlarmListeners();
}

export function createAlarmListeners() {
    browser.alarms?.onAlarm.addListener((alarm: Alarms.Alarm) => {
        if (alarm.name === "unclutter-library-feed-refresh") {
            refreshLibraryFeeds();
        }
    });
    browser.alarms?.onAlarm.addListener((alarm: Alarms.Alarm) => {
        if (alarm.name === "unclutter-library-sync-pull") {
            syncPull();
        }
    });
}
