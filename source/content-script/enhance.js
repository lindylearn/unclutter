import browser from "../common/polyfill";
import { enablePageView } from "./pageview/enablePageView";
import { patchStylesheets } from "./pageview/patchStylesheets";
import { disableStyleChanges, enableStyleChanges } from "./style-changes";

// complete extension functionality injected into a tab

// NOTE: NOT A CONTENT SCRIPT. Using browser.runtime after the initial execution loop seems to make Chrome
// think it's a service worker and it terminates the background script on reload.

// listen to events sent from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event === "ping") {
        // respond that extension is active in this tab
        const pageViewEnabled =
            document.documentElement.classList.contains("pageview");
        sendResponse({ pageViewEnabled });
        return true;
    } else if (message.event === "togglePageView") {
        togglePageView();
        return false;
    }
});

export function togglePageView() {
    // manually toggle pageview status in this tab

    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");

    if (!pageViewEnabled) {
        enablePageView(() => {
            // when user exists page view
            // undo all modifications (including css rewrites and style changes)
            disableStyleChanges();

            browser.runtime.sendMessage(null, {
                event: "disabledPageView",
                trigger: "backgroundClick",
            });
        }, true);

        // rewrite existing stylesheets
        patchStylesheets([...document.styleSheets]);

        enableStyleChanges();
    } else {
        // hack: simulate click to call disable handlers with correct state
        document.documentElement.click();
    }
}

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
