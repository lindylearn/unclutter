import shouldEnableOnURL from "../common/articleDetection";
import browser from "../common/polyfill";

// script injected into every tab before dom constructed
// if configured by the user, initialize the extension funcationality
async function boot() {
    // check if extension should be enabled on this page
    const shouldEnable = await shouldEnableOnURL(window.location.href);
    if (!shouldEnable) {
        return;
    }

    // request injection of additional extension functionality
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
    });
}

boot();
