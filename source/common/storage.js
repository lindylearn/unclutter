import {
    defaultAutomaticallyEnabled,
    defaultExcludedDomains,
} from "./defaultStorage";
import browser from "./polyfill";

export async function getAutomaticallyEnabled() {
    const config = await browser.storage.sync.get(["automatically-enabled"]);
    return config["automatically-enabled"] !== undefined
        ? config["automatically-enabled"]
        : defaultAutomaticallyEnabled;
}

export async function setAutomaticallyEnabled(status) {
    await browser.storage.sync.set({ "automatically-enabled": status });
}

export async function getManualDomainLists() {
    const config = await browser.storage.sync.get([
        "domain-allowlist",
        "domain-denylist",
        "automatically-enabled",
    ]);
    return {
        allow: Object.keys(config["domain-allowlist"] || {}),
        deny: Object.keys(config["domain-denylist"] || {}),
    };
}

export async function shouldEnableForDomain(domain) {
    const config = await browser.storage.sync.get([
        "domain-allowlist",
        "domain-denylist",
        "automatically-enabled",
    ]);

    if (config["domain-allowlist"]?.[domain]) {
        return true;
    }
    if (config["domain-denylist"]?.[domain]) {
        return false;
    }
    if (defaultExcludedDomains.includes(domain)) {
        return false;
    }
    return config["automatically-enabled"] !== undefined
        ? config["automatically-enabled"]
        : defaultAutomaticallyEnabled;
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

    if (status) {
        config["domain-allowlist"][domain] = true;
        delete config["domain-denylist"][domain];
    } else {
        config["domain-denylist"][domain] = true;
        delete config["domain-allowlist"][domain];
    }

    await browser.storage.sync.set({
        "domain-allowlist": config["domain-allowlist"],
        "domain-denylist": config["domain-denylist"],
    });
}
