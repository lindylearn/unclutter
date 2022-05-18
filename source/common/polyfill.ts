// access browser apis similarly in chrome and firefox
// used instead of 'webextension-polyfill' to make bundles more readable.
const browserObj = typeof browser !== "undefined" ? browser : chrome;
browserObj.action = chrome.action || browser.browserAction;
export default browserObj;

export function getBrowserType() {
    if (typeof browser !== "undefined") {
        return "firefox";
    } else {
        return "chromium";
    }
}
