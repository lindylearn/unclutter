import {
    automaticallyEnabledFeatureFlag,
    defaultExcludedDomains,
    defaultFeatureFlags,
} from "./defaultStorage";
import browser from "./polyfill";

export async function getFeatureFlag(key) {
    const config = await browser.storage.sync.get([key]);
    return config[key] !== undefined ? config[key] : defaultFeatureFlags[key];
}
export async function setFeatureFlag(key, status) {
    await browser.storage.sync.set({ [key]: status });
}

export async function getManualDomainLists() {
    const config = await browser.storage.sync.get([
        "domain-allowlist",
        "domain-denylist",
    ]);
    return {
        allow: Object.keys(config["domain-allowlist"] || {}),
        deny: Object.keys(config["domain-denylist"] || {}),
    };
}

export async function shouldEnableForDomain(domain) {
    const userSetting = await getUserSettingForDomain(domain);
    if (userSetting === "allow") {
        return true;
    }
    if (userSetting === "deny") {
        return false;
    }
    if (defaultExcludedDomains.includes(domain)) {
        return false;
    }

    return getFeatureFlag(automaticallyEnabledFeatureFlag);
}
export async function getUserSettingForDomain(domain) {
    const config = await browser.storage.sync.get([
        "domain-allowlist",
        "domain-denylist",
    ]);

    if (config["domain-allowlist"]?.[domain]) {
        return "allow";
    }
    if (config["domain-denylist"]?.[domain]) {
        return "deny";
    }
    return null;
}

export async function setAutomaticStatusForDomain(domain, status) {
    const config = await browser.storage.sync.get([
        "domain-allowlist",
        "domain-denylist",
    ]);
    if (!config["domain-allowlist"]) {
        config["domain-allowlist"] = {};
    }
    if (!config["domain-denylist"]) {
        config["domain-denylist"] = {};
    }

    if (status === "allow") {
        config["domain-allowlist"][domain] = true;
        delete config["domain-denylist"][domain];
    } else if (status === "deny") {
        config["domain-denylist"][domain] = true;
        delete config["domain-allowlist"][domain];
    } else {
        delete config["domain-denylist"][domain];
        delete config["domain-allowlist"][domain];
    }

    await browser.storage.sync.set({
        "domain-allowlist": config["domain-allowlist"],
        "domain-denylist": config["domain-denylist"],
    });
}
