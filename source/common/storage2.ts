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
