import browser, { getBrowserType } from "../common/polyfill";
import { injectScript } from "./inject";
import { reportEnablePageView } from "./metrics";
import type { Alarms } from "webextension-polyfill";
import { rep } from "./library/library";
import { constructLocalArticle } from "@unclutter/library-components/dist/common/util";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import { syncPull } from "./library/sync";

export function onNewInstall(version: string) {
    browser.tabs.create({
        url: "https://unclutter.it/welcome",
        active: true,
    });

    browser.runtime.setUninstallURL("https://unclutter.it/uninstalled");
}

// only run one time after each update
let installed = false;
export function setupWithPermissions(requestPermissions = true) {
    if (installed) {
        return;
    }

    if (browser.contextMenus && browser.alarms) {
        installContextMenu();
        installAlarms();
        installed = true;
    } else if (requestPermissions) {
        console.log("Requesting optional permissions ...");
        browser.permissions
            .request({
                permissions: ["contextMenus", "alarms"],
            })
            .then(() => {
                // need to request permissions as part of user action, can't use async functions
                installContextMenu();
                installAlarms();
                installed = true;
            });
        // don't log permissions errors during initial service worker startup
        // .catch(() => {});
    }
}

function installContextMenu() {
    console.log("Registering context menu ...");

    createOrUpdateContextMenu("unclutter-link", {
        title: "Open Link with Unclutter",
        contexts: ["link"],
    });

    let rightClickContext = "action";
    if (getBrowserType() === "firefox") {
        rightClickContext = "browser_action";
    }
    createOrUpdateContextMenu("open-library", {
        title: "Open library",
        contexts: [rightClickContext],
    });
    createOrUpdateContextMenu("save-article", {
        title: "Save article for later",
        contexts: [rightClickContext],
    });
    // TODO use seperate entries for unregistered users?

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
                url: "https://my.unclutter.it/articles",
                active: true,
            });
        } else if (info.menuItemId === "open-signup") {
            browser.tabs.create({
                url: "https://my.unclutter.it/signup",
                active: true,
            });
        } else if (info.menuItemId === "save-article") {
            (async () => {
                const activeTab = (
                    await browser.tabs.query({ currentWindow: true, active: true })
                )?.[0];
                if (!activeTab) {
                    console.error("No active tab found");
                    return;
                }

                const article = constructLocalArticle(
                    activeTab.url,
                    getUrlHash(activeTab.url),
                    activeTab.title
                );
                await rep.mutate.putArticleIfNotExists(article);
            })();
        }
    });
}

function createOrUpdateContextMenu(id, menuOptions) {
    // try update first
    try {
        browser.contextMenus.update(id, menuOptions);
    } catch {
        const _ = browser.runtime.lastError;
    }

    try {
        browser.contextMenus.create({ ...menuOptions, id });
    } catch {
        const _ = browser.runtime.lastError;
    }
}

async function installAlarms() {
    console.log("Registering periodic alarms...");

    // createAlarmIfNotExists("unclutter-library-feed-refresh", 12);
    createAlarmIfNotExists("unclutter-library-sync-pull", 4);

    createAlarmListeners();
}

async function createAlarmIfNotExists(id: string, everyXHour: number) {
    if (await browser.alarms.get(id)) {
        // already exists
        return;
    }

    browser.alarms.create(id, {
        delayInMinutes: 1,
        periodInMinutes: 60 * everyXHour,
    } as Alarms.CreateAlarmInfoType);
}

export function createAlarmListeners() {
    // browser.alarms?.onAlarm.addListener((alarm: Alarms.Alarm) => {
    //     if (alarm.name === "unclutter-library-feed-refresh") {
    //         refreshLibraryFeeds();
    //     }
    // });
    browser.alarms?.onAlarm.addListener((alarm: Alarms.Alarm) => {
        if (alarm.name === "unclutter-library-sync-pull") {
            syncPull();
        }
    });
}
