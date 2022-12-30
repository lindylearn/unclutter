import browser from "../common/polyfill";
import { renderHighlightsLayer } from "../overlay/highlights";

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
