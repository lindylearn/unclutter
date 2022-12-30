import browser from "../common/polyfill";
import { renderHighlightsLayer } from "../overlay/highlights";

// "light" extension functionality injected into a tab if configured by the user
// this enables the "smart reading" AI highlights

function main() {
    renderHighlightsLayer(enablePageView);
}

function enablePageView() {
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
        trigger: "highlights-layer",
        type: "full",
    });
}

main();
