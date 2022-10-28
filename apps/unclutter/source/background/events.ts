import type { Runtime, Tabs } from "webextension-polyfill";
import { clusterLibraryArticles } from "../common/api";
import { extensionSupportsUrl } from "../common/articleDetection";
import { handleReportBrokenPage } from "../common/bugReport";
import {
    collectAnonymousMetricsFeatureFlag,
    getFeatureFlag,
    isDevelopmentFeatureFlag,
    setFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getLibraryAuth, getLibraryUser, setLibraryAuth } from "../common/storage";
import { saveInitialInstallVersionIfMissing } from "../common/updateMessages";
import { fetchCss } from "./actions";
import { loadAnnotationCountsToMemory } from "./annotationCounts";
import { getAllBookmarks, requestBookmarksPermission } from "./bookmarks";
import { enableInTab, injectScript, togglePageViewMessage } from "./inject";
import { onNewInstall, setupWithPermissions } from "./install";
import {
    initLibrary,
    processReplicacheMessage,
    processReplicacheSubscribe,
} from "./library/library";
import { captureActiveTabScreenshot, getLocalScreenshot } from "./library/screenshots";
import { search } from "./library/search";
import {
    getRemoteFeatureFlags,
    reportDisablePageView,
    reportEnablePageView,
    reportEvent,
    reportSettings,
    startMetrics,
} from "./metrics";
import { TabStateManager } from "./tabs";

const tabsManager = new TabStateManager();

// toggle page view on extension icon click
browser.action.onClicked.addListener((tab: Tabs.Tab) => {
    const url = new URL(tab.url);

    if (url.href === "https://library.lindylearn.io/import?provider=bookmarks") {
        // Support importing browser bookmarks into the extension companion website (which allows the user to organize & easily open articles with the extension).
        // This code only runs if the user explicitly triggered it: they selected the browser import on the companion website, clicked the extension icon as stated in the instructions, then granted the optional bookmarks permission.
        // lindylearn.io is the official publisher domain for this browser extension.

        requestBookmarksPermission().then(async (granted: boolean) => {
            const libraryUser = await getLibraryUser();

            if (granted && libraryUser) {
                console.log("Starting bookmarks library import");
                const bookmarks = await getAllBookmarks();
                clusterLibraryArticles(bookmarks, libraryUser);
            }
        });
    } else if (extensionSupportsUrl(url)) {
        // enable reader mode on current site
        enableInTab(tab.id).then((didEnable) => {
            if (!didEnable) {
                // already active, so disable
                togglePageViewMessage(tab.id);
                return;
            }

            tabsManager.checkIsArticle(tab.id, tab.url);
            if (didEnable) {
                tabsManager
                    .getSocialAnnotationsCount(tab.id, tab.url)
                    .then((socialCommentsCount) =>
                        reportEnablePageView("manual", socialCommentsCount)
                    );
            }
        });
    }

    // can only request permissions from user action, use this opportunity
    // can't make callback a promise for this to work
    setupWithPermissions();
});

// handle events from content scripts and seperate Unclutter New Tab extension
browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onMessageExternal.addListener(handleMessage);
function handleMessage(
    message: any,
    sender: Runtime.MessageSender,
    sendResponse: (...args: any[]) => void
) {
    // console.log(`Received '${message.event}' message:`, message);

    if (message.event === "disabledPageView") {
        reportDisablePageView(message.trigger, message.pageHeightPx);
    } else if (message.event === "requestEnhance") {
        // event sent from boot.js to inject additional functionality
        // browser apis are only available in scripts injected from background scripts or manifest.json
        console.log("boot.js requested injection into tab");
        injectScript(sender.tab.id, "content-script/enhance.js");

        tabsManager
            .getSocialAnnotationsCount(sender.tab.id, sender.url)
            .then((socialCommentsCount) =>
                reportEnablePageView(message.trigger, socialCommentsCount)
            );
    } else if (message.event === "openOptionsPage") {
        browser.runtime.openOptionsPage();
    } else if (message.event === "fetchCss") {
        fetchCss(message.url).then(sendResponse);
        return true;
    } else if (message.event === "reportEvent") {
        reportEvent(message.name, message.data);
    } else if (message.event === "getRemoteFeatureFlags") {
        getRemoteFeatureFlags().then(sendResponse);
        return true;
    } else if (message.event === "checkLocalAnnotationCount") {
        // trigger from boot.js because we don't have tabs permissions
        tabsManager.checkIsArticle(sender.tab.id, sender.url).then(sendResponse);
        return true;
    } else if (message.event === "getSocialAnnotationsCount") {
        tabsManager.getSocialAnnotationsCount(sender.tab.id, sender.url).then(sendResponse);
        return true;
    } else if (message.event === "setSocialAnnotationsCount") {
        tabsManager.setSocialAnnotationsCount(sender.tab.id, message.count);
    } else if (message.event === "reportBrokenPage") {
        handleReportBrokenPage(message.data);
    } else if (message.event === "openLinkWithUnclutter") {
        const onTabActive = async (tab: Tabs.Tab) => {
            // need to wait until site loaded, as have no permissions on new tab page
            await new Promise((resolve) => setTimeout(resolve, 100));

            await injectScript(tab.id, "content-script/enhance.js");

            if (message.focusedAnnotation) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                await browser.tabs.sendMessage(tab.id, {
                    event: "focusAnnotation",
                    focusedAnnotation: message.focusedAnnotation,
                });
            }
        };
        if (message.newTab) {
            browser.tabs.create({ url: message.url, active: true }, onTabActive);
        } else {
            browser.tabs.update(undefined, { url: message.url }, onTabActive);
        }
    } else if (message.event === "focusAnnotation") {
        // direct message back to listeners in same tab
        browser.tabs.sendMessage(sender.tab.id, message);
    } else if (message.event === "openLibrary") {
        let urlToOpen = `https://library.lindylearn.io/`;
        if (message.topicId !== undefined) {
            urlToOpen = `https://library.lindylearn.io/topics/${message.topicId}`;
        }

        browser.tabs.create({
            url: urlToOpen,
            active: true,
        });
    } else if (message.event === "setLibraryAuth") {
        setLibraryAuth(message.userId, message.webJwt).then(() => {
            initLibrary();
        });
    } else if (message.event === "getLibraryAuth") {
        getLibraryAuth().then(sendResponse);
        return true;
    } else if (message.event === "processReplicacheMessage") {
        processReplicacheMessage(message).then(sendResponse);
        return true;
    } else if (message.event === "captureActiveTabScreenshot") {
        captureActiveTabScreenshot(message.articleId, message.bodyRect, message.devicePixelRatio);
    } else if (message.event === "getLocalScreenshot") {
        getLocalScreenshot(message.articleId).then(sendResponse);
        return true;
    } else if (message.event === "getUnclutterVersion") {
        browser.management.getSelf().then((extensionInfo) => sendResponse(extensionInfo.version));
        return true;
    } else if (message.event === "searchLibrary") {
        search(message.query).then(sendResponse);
        return true;
    }

    return false;
}

// handle long-lived connections e.g. for replicache data change subscribes
browser.runtime.onConnect.addListener(handleConnect);
browser.runtime.onConnectExternal.addListener(handleConnect);
function handleConnect(port: Runtime.Port) {
    if (port.name === "replicache-subscribe") {
        processReplicacheSubscribe(port);
    }
    // ports will be disconnected when the modal iframe is closed
}

// run on install, extension update, or browser update
browser.runtime.onInstalled.addListener(async ({ reason }) => {
    const extensionInfo = await browser.management.getSelf();
    const isNewInstall = reason === "install";
    const isDev = extensionInfo.installType === "development";

    if (isDev) {
        // disable metrics in dev mode
        await setFeatureFlag(collectAnonymousMetricsFeatureFlag, false);
        await setFeatureFlag(isDevelopmentFeatureFlag, true);
    }

    // report aggregates on enabled extension features
    // this function should be executed every few days
    reportSettings(extensionInfo.version, isNewInstall);

    if (isNewInstall && !isDev) {
        onNewInstall(extensionInfo.version);
    }

    saveInitialInstallVersionIfMissing(extensionInfo.version);

    // show opt shortcut icon on mac
    browser.runtime.getPlatformInfo().then(({ os }) =>
        browser.action.setTitle({
            title: "Unclutter Current Article (⌥+C)",
        })
    );
});

// track tab changes to update extension icon badge
browser.tabs.onActivated.addListener((info: Tabs.OnActivatedActiveInfoType) =>
    tabsManager.onChangeActiveTab(info.tabId)
);
browser.tabs.onUpdated.addListener((tabId: number, change: Tabs.OnUpdatedChangeInfoType) => {
    if (change.url) {
        // clear state for old url, checkLocalAnnotationCount will be sent for likely articles again
        tabsManager.onCloseTab(tabId);
    }
});
browser.tabs.onRemoved.addListener((tabId: number) => tabsManager.onCloseTab(tabId));

// initialize on every service worker start
async function initializeServiceWorker() {
    // isDevelopmentFeatureFlag not available during initial install yet
    const extensionInfo = await browser.management.getSelf();
    const isDev = extensionInfo.installType === "development";

    startMetrics(isDev);

    initLibrary();
    loadAnnotationCountsToMemory();
}

initializeServiceWorker();
setupWithPermissions(); // needs to run after every reload to configure event handlers
