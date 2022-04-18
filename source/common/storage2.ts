import browser from "./polyfill";

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
