import browser from "./polyfill";

export async function getAllCustomDomainSettings() {
    const config = await browser.storage.sync.get([
        "domain-allowlist",
        "domain-denylist",
        "custom-domain-themes",
    ]);
    return {
        allow: Object.keys(config["domain-allowlist"] || {}),
        deny: Object.keys(config["domain-denylist"] || {}),
        themes: config["custom-domain-themes"] || {},
    };
}

export type domainUserSetting = "allow" | "deny" | null;
export async function getUserSettingForDomain(
    domain: string
): Promise<domainUserSetting> {
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

export async function setUserSettingsForDomain(domain, status) {
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

export async function getDomainUserTheme(domain) {
    const config = await browser.storage.sync.get(["custom-domain-themes"]);
    return config["custom-domain-themes"]?.[domain];
}
export async function mergeDomainUserTheme(domain, partialTheme) {
    const config = await browser.storage.sync.get(["custom-domain-themes"]);
    const themeConfig = config["custom-domain-themes"] || {};

    themeConfig[domain] = {
        ...themeConfig[domain],
        ...partialTheme,
    };
    await browser.storage.sync.set({ "custom-domain-themes": themeConfig });
}
export async function deleteDomainUserTheme(domain) {
    const config = await browser.storage.sync.get(["custom-domain-themes"]);
    const themeConfig = config["custom-domain-themes"];

    delete themeConfig[domain];
    await browser.storage.sync.set({ "custom-domain-themes": themeConfig });
}
