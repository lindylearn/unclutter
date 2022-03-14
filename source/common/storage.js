import axios from "axios";
import browser from "webextension-polyfill";
import { defaultExcludedDomains } from "./defaultStorage";

export async function getHypothesisToken() {
    return (await getUserInfo())["hypothesis-api-token"];
}

export async function getHypothesisUsername() {
    return (await getUserInfo())["hypothesis-username"];
}

export async function getUserInfo() {
    return await browser.storage.sync.get([
        "hypothesis-api-token",
        "hypothesis-username",
    ]);
}

export async function validateSaveToken(token, forceSave = false) {
    const userName = await validateApiToken(token);
    if (!userName && !forceSave) {
        return false;
    }

    await browser.storage.sync.set({
        "hypothesis-api-token": token,
        "hypothesis-username": userName,
    });

    return true;
}

export async function validateApiToken(apiToken) {
    try {
        const response = await axios.get(
            `https://api.hypothes.is/api/profile`,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                },
            }
        );
        const fullUserId = response.data.userid; // e.g. acct:remikalir@hypothes.is
        return fullUserId.match(/([^:]+)@/)[1];
    } catch {
        return null;
    }
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
    return config["automatically-enabled"];
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
