import browser from "../common/polyfill";

// Script injected into Uncluter Library pages to redirect messages to the background script
// This is only used for Firefox, on Chromium we can use externally_connectable

window.addEventListener("message", function (event) {
    browser.runtime.sendMessage(event.data);
});
