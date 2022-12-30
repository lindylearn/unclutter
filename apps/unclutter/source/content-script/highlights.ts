import browser from "../common/polyfill";
import { renderHighlightsLayer } from "../overlay/highlights";

// "light" extension functionality injected into a tab if configured by the user
// this enables the "smart reading" AI highlights

function main() {
    // if injected later than enhance.ts (e.g. because of automatic activation),
    // don't run scrollbar tweaks and don't handle events
    // @ts-ignore
    const enhanceActive = window.unclutterEnhanceLoaded;

    const preparePageView = renderHighlightsLayer(enablePageView, enhanceActive);
    if (!enhanceActive) {
        handleEvents(preparePageView);
    }
}

function enablePageView() {
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
        trigger: "highlights-layer",
        type: "full",
    });
}

// handle background events until enhance.ts active, to ensure highlights cleanup code is called
function handleEvents(preparePageView) {
    function onMessage(message, sender, sendResponse) {
        if (message.event === "ping") {
            sendResponse({ pageViewEnabled: false });
            return true;
        } else if (message.event === "togglePageView") {
            browser.runtime.onMessage.removeListener(onMessage);

            preparePageView();
            enablePageView();
            return false;
        }
    }
    browser.runtime.onMessage.addListener(onMessage);
}

main();
