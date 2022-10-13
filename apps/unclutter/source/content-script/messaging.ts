import browser from "../common/polyfill";
import {
    A,
    M,
    accessors,
    mutators,
    RuntimeReplicache,
} from "@unclutter/library-components/dist/store";
import { ReplicacheProxyEventTypes } from "../background/library/library";

export async function reportEventContentScript(name: string, data = {}) {
    browser.runtime.sendMessage(null, {
        event: "reportEvent",
        name,
        data,
    });
}

export async function getRemoteFeatureFlag(key: string) {
    const featureFlags = await browser.runtime.sendMessage(null, {
        event: "getRemoteFeatureFlags",
    });
    return featureFlags?.[key];
}

export function openArticle(url: string) {
    browser.runtime.sendMessage(null, {
        event: "openLinkWithUnclutter",
        url: url,
        newTab: true,
    });
}

export async function getUnclutterVersion(): Promise<string> {
    return await browser.runtime.sendMessage(null, {
        event: "getUnclutterVersion",
    });
}

export function captureActiveTabScreenshot(
    articleId: string,
    bodyRect: DOMRect,
    devicePixelRatio: number
) {
    browser.runtime.sendMessage(null, {
        event: "captureActiveTabScreenshot",
        articleId,
        bodyRect,
        devicePixelRatio,
    });
}

export async function getLocalScreenshot(articleId: string) {
    return await browser.runtime.sendMessage(null, {
        event: "getLocalScreenshot",
        articleId,
    });
}

export async function processReplicacheContentScript(
    type: ReplicacheProxyEventTypes,
    methodName?: string,
    args?: any
) {
    return await browser.runtime.sendMessage(null, {
        event: "processReplicacheMessage",
        type,
        methodName,
        args,
    });
}

export class ReplicacheProxy implements RuntimeReplicache {
    // @ts-ignore
    query: RuntimeReplicache["query"] = Object.keys(accessors).reduce(
        (obj, fnName: keyof A) => {
            obj[fnName] = (...args: any[]) => {
                return processReplicacheContentScript("query", fnName, args);
            };
            return obj;
        },
        {}
    );

    // @ts-ignore
    mutate: RuntimeReplicache["mutate"] = Object.keys(mutators).reduce(
        (obj, fnName: keyof M) => {
            obj[fnName] = (args: any) => {
                return processReplicacheContentScript("mutate", fnName, args);
            };
            return obj;
        },
        {}
    );

    pull: RuntimeReplicache["pull"] = () => {
        processReplicacheContentScript("pull");
    };
}
