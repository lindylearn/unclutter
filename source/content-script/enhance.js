import browser from "../common/polyfill";
import { getDomainFrom } from "../common/util";
import { enablePageView } from "./pageview/enablePageView";
import {
    disableStyleChanges,
    enableStyleChanges,
    fadeOut,
} from "./style-changes";
import { modifyBodyStyle } from "./style-changes/body";
import { insertPageSettings } from "./switch/insert";

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

let isSimulatedClick = false;
export async function togglePageView() {
    // manually toggle pageview status in this tab

    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");

    if (!pageViewEnabled) {
        const domain = getDomainFrom(new URL(window.location.href));

        // *** Fade-out phase ***
        // Visibly hide noisy elements and meanwhile perform heavy operation

        // wait up to 300ms for animation completion
        // don't wait after very long parsing time
        const [transitionTriggers, _] = await Promise.all([
            fadeOut(domain),
            new Promise((r) => setTimeout(r, 300)),
        ]);
        const [contentBlockHide, enableResponsiveStyle, patchDom] =
            transitionTriggers;

        // *** PageView transition phase ***
        // Shift layout and reduce page width in one go

        document.body.style.setProperty("transition", "all 0.3s");

        enableResponsiveStyle();
        contentBlockHide();
        patchDom();

        modifyBodyStyle();

        isSimulatedClick = false;
        await enablePageView(() => {
            // when user exists page view
            // undo all modifications (including css rewrites and style changes)
            disableStyleChanges();

            if (!isSimulatedClick) {
                // already emitted elsewhere for simulated non-background clicks
                browser.runtime.sendMessage(null, {
                    event: "disabledPageView",
                    trigger: "backgroundClick",
                });
            }
        }, true);

        setTimeout(() => {
            insertPageSettings(domain);
        }, 500);
    } else {
        // hack: simulate click to call disable handlers with correct state (also from boot.js)
        isSimulatedClick = true;
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
