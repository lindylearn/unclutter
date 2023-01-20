import browser from "../common/polyfill";
// import { renderHighlightsLayer } from "../overlay/highlights";

import SmartHighlightsModifier from "./modifications/DOM/smartHighlights";

// "light" extension functionality injected into a tab if configured by the user
// this enables the "smart reading" AI highlights

async function main() {
    // if injected later than enhance.ts (e.g. because of automatic activation),
    // don't run scrollbar tweaks and don't handle events
    // @ts-ignore
    const enhanceActive = window.unclutterEnhanceLoaded;
    // @ts-ignore
    window.unclutterHighlightsLoaded = true;

    const smartHighlightsModifier = new SmartHighlightsModifier();

    const annotations = await smartHighlightsModifier.parseAnnotationsFromArticle();
    await browser.runtime.sendMessage(null, {
        event: "setParsedAnnotations",
        annotations,
    });

    // const preparePageView = renderHighlightsLayer(userInfo.id, enablePageView, enhanceActive);
    // if (!enhanceActive) {
    //     handleEvents(preparePageView);
    // }
}

// function enablePageView() {
//     browser.runtime.sendMessage(null, {
//         event: "requestEnhance",
//         trigger: "highlights-layer",
//         type: "full",
//     });
// }

// // handle background events until enhance.ts active, to ensure highlights cleanup code is called
// function handleEvents(preparePageView) {
//     function onMessage(message, sender, sendResponse) {
//         if (message.event === "ping") {
//             sendResponse({ pageViewEnabled: false });
//             return true;
//         } else if (message.event === "togglePageView") {
//             browser.runtime.onMessage.removeListener(onMessage);

//             preparePageView();
//             enablePageView();
//             return false;
//         }
//     }
//     browser.runtime.onMessage.addListener(onMessage);
// }

main();
