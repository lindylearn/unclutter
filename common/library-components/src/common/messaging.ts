import type { UserInfo } from "../store";
import { sendMessage } from "./extension";

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

export async function getLocalScreenshot(articleId: string): Promise<string | undefined> {
    return await sendMessage({
        event: "getLocalScreenshot",
        articleId,
    });
}
