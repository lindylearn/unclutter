import browser from "../common/polyfill";

export async function reportEventContentScript(
    name: string,
    data = {},
    isDev = false
) {
    browser.runtime.sendMessage(null, {
        event: "reportEvent",
        name,
        data,
        isDev,
    });
}
