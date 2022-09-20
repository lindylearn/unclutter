import browser from "../common/polyfill";

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
    methodName: string,
    args: any[] = []
) {
    return await browser.runtime.sendMessage(null, {
        event: "processReplicacheAccessor",
        methodName,
        args,
    });
}
export async function processReplicacheMutator(
    methodName: string,
    args: object = {}
) {
    return await browser.runtime.sendMessage(null, {
        event: "processReplicacheMutator",
        methodName,
        args,
    });
}
