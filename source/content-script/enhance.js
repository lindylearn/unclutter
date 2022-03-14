import browser from "../common/polyfill";
import { disableStyleChanges, enableStyleChanges } from "./pageview";
import { enablePageView } from "./pageview/enablePageView";
import { patchStylesheets } from "./pageview/patchStylesheets";

// additional functionality injected after extension activated on side (after dom constructed)

// listen to togglePageView events sent from background script
browser.runtime.onMessage.addListener(async (event) => {
    if (event === "ping") {
        return true;
    } else if (event === "togglePageView") {
        const pageViewEnabled =
            document.documentElement.classList.contains("pageview");
        if (!pageViewEnabled) {
            enablePageView(() => {
                // when user exists page view
                // undo all modifications (including css rewrites and style changes)
                disableStyleChanges();
            });

            // rewrite existing stylesheets
            patchStylesheets([...document.styleSheets]);

            enableStyleChanges();
        } else {
            // hack: simulate click to call disable handlers with correct state
            document.documentElement.click();
        }
    }
});

// perform style changes if pageview triggered by boot.js
async function enhance() {
    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");
    if (!pageViewEnabled) {
        return;
    }
    console.log("enhance");

    enableStyleChanges();

    // attach additional style unpatch on pageview hide
    document.documentElement.addEventListener(
        "click",
        (event) => {
            if (event.target.tagName === "HTML") {
                disableStyleChanges();
            }
        },
        true
    );
}
enhance();
