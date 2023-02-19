import type { UserInfo } from "../store";
import { getBrowser, sendMessage } from "./extension";

// handle events from the browser extension install page & integrated article library
// adding externally_connectable may not work for existing installs, and isn't supported on firefox
export function listenForPageEvents() {
    window.addEventListener("message", function (event) {
        if (event.data.event === "proxyUnclutterMessage") {
            const messageId = event.data.messageId;

            getBrowser().runtime.sendMessage(event.data.message, (response) => {
                window.postMessage(
                    {
                        event: "proxyUnclutterMessageResponse",
                        messageId,
                        response,
                    },
                    "*"
                );
            });
        }
    });

    // return browser bookmarks to import into the extension's companion website
    // this is triggered when the user clicks the extension icon on the Unclutter import website
    getBrowser().runtime.onMessage.addListener((message) => {
        if (message.event === "returnBrowserBookmarks") {
            window.postMessage(message, "*");
        }
    });
}

export async function getUserInfoSimple(): Promise<UserInfo | undefined> {
    return await sendMessage({ event: "getUserInfo" });
}

export function reportEventContentScript(name: string, data = {}) {
    sendMessage({
        event: "reportEvent",
        name,
        data,
    });
}

export async function getRemoteFeatureFlag(key: string) {
    const featureFlags = await sendMessage({
        event: "getRemoteFeatureFlags",
    });
    return featureFlags?.[key];
}

export function openArticle(url: string) {
    sendMessage({
        event: "openLinkWithUnclutter",
        url: url,
        newTab: true,
    });
}

export async function getUnclutterVersion(): Promise<string | undefined> {
    return await sendMessage({
        event: "getUnclutterVersion",
    });
}
export async function getNewTabVersion(): Promise<string | undefined> {
    return await sendMessage({
        event: "getNewTabVersion",
    });
}

export function captureActiveTabScreenshot(
    articleId: string,
    bodyRect: DOMRect,
    devicePixelRatio: number
) {
    sendMessage({
        event: "captureActiveTabScreenshot",
        articleId,
        bodyRect,
        devicePixelRatio,
    });
}

export async function getLocalScreenshot(articleId: string): Promise<string | null> {
    const response = await sendMessage({
        event: "getLocalScreenshot",
        articleId,
    });
    return response || null;
}
