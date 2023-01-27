import type { UserInfo } from "../store";
import { getBrowser, getNewTabExtensionId, getUnclutterExtensionId } from "./extension";

export async function getUserInfoSimple(): Promise<UserInfo | undefined> {
    return await getBrowser().runtime.sendMessage(getUnclutterExtensionId(), {
        event: "getUserInfo",
    });
}

export async function reportEventContentScript(
    name: string,
    data = {},
    targetExtension: string | null = null
) {
    getBrowser().runtime.sendMessage(targetExtension, {
        event: "reportEvent",
        name,
        data,
    });
}

export async function getRemoteFeatureFlag(key: string, targetExtension: string | null = null) {
    const featureFlags = await getBrowser().runtime.sendMessage(targetExtension, {
        event: "getRemoteFeatureFlags",
    });
    return featureFlags?.[key];
}

export function openArticle(url: string, targetExtension: string | null = null) {
    getBrowser().runtime.sendMessage(targetExtension, {
        event: "openLinkWithUnclutter",
        url: url,
        newTab: true,
    });
}

export async function getUnclutterVersion(): Promise<string> {
    return await getBrowser().runtime.sendMessage(getUnclutterExtensionId(), {
        event: "getUnclutterVersion",
    });
}
export async function getNewTabVersion(): Promise<string> {
    return await getBrowser().runtime.sendMessage(getNewTabExtensionId(), {
        event: "getNewTabVersion",
    });
}

export function captureActiveTabScreenshot(
    articleId: string,
    bodyRect: DOMRect,
    devicePixelRatio: number,
    targetExtension: string | null = null
) {
    getBrowser().runtime.sendMessage(targetExtension, {
        event: "captureActiveTabScreenshot",
        articleId,
        bodyRect,
        devicePixelRatio,
    });
}

export async function getLocalScreenshot(articleId: string, targetExtension: string | null = null) {
    return await getBrowser()?.runtime?.sendMessage(targetExtension, {
        event: "getLocalScreenshot",
        articleId,
    });
}
