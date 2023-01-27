import { fetchRssFeed } from "@unclutter/library-components/dist/feeds";
import type { Runtime, Tabs } from "webextension-polyfill";
import { extensionSupportsUrl } from "../common/articleDetection";
import { handleReportBrokenPage } from "../common/bugReport";
import {
    enableExperimentalFeatures,
    isDevelopmentFeatureFlag,
    setFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { setLibraryAuth } from "../common/storage";
import { saveInitialInstallVersionIfMissing } from "../common/updateMessages";
import { fetchCss } from "./actions";
import { getAllBookmarks, requestBookmarksPermission } from "./bookmarks";
import { enableInTab, injectScript, togglePageViewMessage } from "./inject";
import { createAlarmListeners, onNewInstall, setupWithPermissions } from "./install";
import { discoverRssFeed } from "./library/feeds";
import {
    initLibraryOnce,
    processReplicacheMessage,
    processReplicacheSubscribe,
    rep,
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
// import { getHeatmap, loadHeatmapModel } from "@unclutter/heatmap/dist/heatmap";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import { getHeatmapRemote } from "@unclutter/library-components/dist/common/api";

const tabsManager = new TabStateManager();

// toggle page view on extension icon click
browser.action.onClicked.addListener((tab: Tabs.Tab) => {
    const url = new URL(tab.url);

    if (url.href === "https://my.unclutter.it/import?from=bookmarks") {
        // Support importing browser bookmarks into the extension companion website (which allows the user to organize & easily open articles with the extension).
        // This code only runs if the user explicitly triggered it: they selected the browser import on the companion website, clicked the extension icon as stated in the instructions, then granted the optional bookmarks permission.
        requestBookmarksPermission().then(async (granted: boolean) => {
            if (granted) {
                console.log("Starting bookmarks library import");
                const bookmarks = await getAllBookmarks();
                await browser.tabs.sendMessage(tab.id, {
                    event: "returnBrowserBookmarks",
                    bookmarks,
                });
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

            if (didEnable) {
                tabsManager.onActivateReaderMode(tab.id);
                reportEnablePageView("manual");
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
    if (message.event === "disabledPageView") {
        reportDisablePageView(message.trigger, message.pageHeightPx);
    } else if (message.event === "requestEnhance") {
        // event sent from boot.js to inject additional functionality
        // browser apis are only available in scripts injected from background scripts or manifest.json
        console.log(`Requested ${message.type} script injection`);

        if (message.type === "full") {
            injectScript(sender.tab.id, "content-script/enhance.js");
            tabsManager.onActivateReaderMode(sender.tab.id);
            reportEnablePageView(message.trigger);
        } else if (message.type === "highlights") {
            if (tabsManager.hasAIAnnotations(sender.tab.id)) {
                // already parsed page for annotations before
                return;
            }

            injectScript(sender.tab.id, "content-script/highlights.js");
        }
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
    } else if (message.event === "reportBrokenPage") {
        handleReportBrokenPage(message.data);
    } else if (message.event === "openLink") {
        if (message.newTab) {
            browser.tabs.create({ url: message.url, active: true });
        } else {
            browser.tabs.update(undefined, { url: message.url });
        }
    } else if (message.event === "openLinkWithUnclutter") {
        const onTabActive = async (tab: Tabs.Tab) => {
            // need to wait until site loaded, as have no permissions on new tab page
            await new Promise((resolve) => setTimeout(resolve, 100));

            await injectScript(tab.id, "content-script/enhance.js");
            tabsManager.onActivateReaderMode(sender.tab.id);

            if (message.annotationId) {
                await new Promise((resolve) => setTimeout(resolve, 200));
                await browser.tabs.sendMessage(tab.id, {
                    event: "focusAnnotation",
                    annotationId: message.annotationId,
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
        browser.tabs.create({
            url: `https://library.lindylearn.io/`,
            active: true,
        });
    } else if (message.event === "setLibraryAuth") {
        setLibraryAuth(message.userId, message.webJwt).then(() => {
            initLibraryOnce();
        });
    } else if (message.event === "initLibrary") {
        initLibraryOnce();
    } else if (message.event === "getUserInfo") {
        rep?.query.getUserInfo().then(sendResponse);
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
        search(message.type, message.query).then(sendResponse);
        return true;
    } else if (message.event === "discoverRssFeed") {
        discoverRssFeed(message.sourceUrl, message.feedCandidates, message.tagLinkCandidates).then(
            sendResponse
        );
        return true;
    } else if (message.event === "fetchRssFeed") {
        fetchRssFeed(message.feedUrl).then(sendResponse);
        return true;
    } else if (message.event === "getHeatmap") {
        // getHeatmap(message.paragraphs).then(sendResponse);
        getHeatmapRemote(message.paragraphs).then(sendResponse);
        return true;
    } else if (message.event === "clearTabState") {
        tabsManager.onCloseTab(sender.tab.id);
    } else if (message.event === "checkHasLocalAnnotations") {
        const articleId = getUrlHash(sender.tab.url);
        tabsManager.checkHasLocalAnnotations(sender.tab.id, articleId).then(sendResponse);
        return true;
    } else if (message.event === "setParsedAnnotations") {
        tabsManager.setParsedAnnotations(sender.tab.id, message.annotations);
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
        await setFeatureFlag(isDevelopmentFeatureFlag, true);
        await setFeatureFlag(enableExperimentalFeatures, true);
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
    const userInfo = await initLibraryOnce(isDev);

    // if (userInfo?.aiEnabled) {
    //     // load tensorflow model
    //     // unfortunately cannot create nested service workers, see https://bugs.chromium.org/p/chromium/issues/detail?id=1219164
    //     // another option: importScript()? https://stackoverflow.com/questions/66406672/how-do-i-import-scripts-into-a-service-worker-using-chrome-extension-manifest-ve
    //     loadHeatmapModel();
    // }
}

initializeServiceWorker();
setupWithPermissions(); // needs to run after every reload to configure event handlers
createAlarmListeners();
