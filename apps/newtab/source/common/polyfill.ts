// use same api for chromium and firefox
const browserObj = typeof browser !== "undefined" ? browser : chrome;
browserObj.action = chrome.action || browserObj.browserAction;
export default browserObj;

export type BrowserType = "chromium" | "firefox";
export function getBrowserType(): BrowserType {
    if (typeof browser !== "undefined") {
        return "firefox";
    } else {
        return "chromium";
    }
}
