import { reportEvent } from "../background/metrics";
import { pxToNumber } from "./css";
import { defaultFontSizePx, defaultPageWidth } from "./defaultStorage";
import browser from "./polyfill";
import { themeName } from "./theme";

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

export interface UserTheme {
    fontSize: number;
    pageWidth: string;
    colorTheme: themeName;
}

export async function getUserTheme(): Promise<UserTheme> {
    const config = await browser.storage.sync.get(["custom-global-theme"]);
    const theme = config["custom-global-theme"] || {};

    let fontSize = theme.fontSize;
    if (
        !theme.fontSize ||
        (theme.fontSize && isNaN(pxToNumber(theme.fontSize)))
    ) {
        fontSize = defaultFontSizePx;
    }

    return {
        fontSize,
        pageWidth: theme.pageWidth || defaultPageWidth,
        colorTheme: theme.colorTheme || "auto",
    };
}
export async function mergeUserTheme(partialTheme: UserTheme): Promise<void> {
    const config = await browser.storage.sync.get(["custom-global-theme"]);
    const themeConfig = {
        ...(config["custom-global-theme"] || {}),
        ...partialTheme,
    };
    await browser.storage.sync.set({ "custom-global-theme": themeConfig });
}

export async function getPageReportCount(): Promise<number> {
    const config = await browser.storage.sync.get(["reported-pages-count"]);
    return config["reported-pages-count"] || 0;
}

export async function incrementPageReportCount(): Promise<void> {
    const config = await browser.storage.sync.get(["reported-pages-count"]);
    await browser.storage.sync.set({
        "reported-pages-count": (config["reported-pages-count"] || 0) + 1,
    });
}

export async function getBlockedElementSelectors(
    domain: string
): Promise<string[]> {
    const config = await browser.storage.sync.get([
        "blocked-element-selectors",
    ]);
    const selectorsPerDomain = config["blocked-element-selectors"] || {};
    return selectorsPerDomain[domain] || [];
}
export async function setBlockedElementSelectors(
    domain: string,
    selectors: string[]
): Promise<void> {
    const config = await browser.storage.sync.get([
        "blocked-element-selectors",
    ]);
    await browser.storage.sync.set({
        "blocked-element-selectors": {
            ...config["blocked-element-selectors"],
            [domain]: selectors,
        },
    });
}

export async function getLibraryUser(): Promise<string | null> {
    const config = await browser.storage.sync.get(["library-user-id"]);
    return config["library-user-id"] || null;
}

export async function getLibraryUserJwt(): Promise<string | null> {
    const config = await browser.storage.sync.get(["library-web-jwt"]);
    return config["library-web-jwt"] || null;
}

export async function setLibraryUser(
    userId: string,
    webJwt: string
): Promise<void> {
    await browser.storage.sync.set({ "library-user-id": userId });
    await browser.storage.sync.set({ "library-web-jwt": webJwt });
    // reportEvent("extensionLibraryLogin", { libraryUser: userId });
}
