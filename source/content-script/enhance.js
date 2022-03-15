import browser from "../common/polyfill";
import { disableStyleChanges, enableStyleChanges } from "./pageview";
import { enablePageView } from "./pageview/enablePageView";
import { patchStylesheets } from "./pageview/patchStylesheets";

// complete extension functionality injected into a tab

// listen to events sent from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");

    if (message.event === "ping") {
        // respond that extension is active in this tab
        sendResponse({ pageViewEnabled });
        return true;
    } else if (message.event === "togglePageView") {
        // manually toggle pageview status in this tab

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

        return false;
    }
});

// perform style changes if pageview was already triggered by boot.js
async function enhance() {
    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");
    if (!pageViewEnabled) {
        return;
    }
    console.log("enhance page");

    enableStyleChanges();

    // attach additional style unpatch functionality on pageview hide
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
