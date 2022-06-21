import browser from "./polyfill";

// In seperate file to prevent tree-shake overwrite during bundling

export async function getAllCustomDomainSettings() {
    const config = await browser.storage.sync.get([
        "domain-allowlist",
        "domain-denylist",
    ]);
    return {
        allow: Object.keys(config["domain-allowlist"] || {}),
        deny: Object.keys(config["domain-denylist"] || {}),
    };
}

export async function getPageReportCount(): Promise<number> {
    const config = await browser.storage.sync.get(["reported-pages-count"]);
    return config["reported-pages-count"] || 0;
}

export async function getAllElementBlockSelectors(): Promise<string[]> {
    const config = await browser.storage.sync.get([
        "blocked-element-selectors",
    ]);
    return [
        ...Object.values(config["blocked-element-selectors"] || []),
    ].flat() as string[];
}
