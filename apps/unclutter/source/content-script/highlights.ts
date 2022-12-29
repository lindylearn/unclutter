import browser from "../common/polyfill";
import { startAssistant } from "../overlay/assistant";

function main() {
    startAssistant(enablePageView);
}

function enablePageView() {
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
        type: "full",
    });
}

main();
