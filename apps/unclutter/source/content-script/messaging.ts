import browser from "../common/polyfill";
import {
    A,
    M,
    accessors,
    mutators,
    RuntimeReplicache,
} from "@unclutter/library-components/dist/store";

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

export async function openArticle(url: string) {
    browser.runtime.sendMessage(null, {
        event: "openLinkWithUnclutter",
        url: url,
        newTab: true,
    });
}

export async function processReplicacheAccessor(
    methodName: keyof A,
    args: any[] = []
) {
    return await browser.runtime.sendMessage(null, {
        event: "processReplicacheAccessor",
        methodName,
        args,
    });
}
export async function processReplicacheMutator(
    methodName: keyof M,
    args: object = {}
) {
    return await browser.runtime.sendMessage(null, {
        event: "processReplicacheMutator",
        methodName,
        args,
    });
}

export class ReplicacheProxy
    implements Pick<RuntimeReplicache, "query" | "mutate">
{
    // @ts-ignore
    query = Object.keys(accessors).reduce((obj, fnName: keyof A) => {
        obj[fnName] = (...args: any[]) => {
            return processReplicacheAccessor(fnName, args);
        };
        return obj;
    }, {});

    // @ts-ignore
    mutate = Object.keys(mutators).reduce((obj, fnName: keyof M) => {
        obj[fnName] = (args: any) => {
            return processReplicacheMutator(fnName, args);
        };
        return obj;
    }, {});
}
