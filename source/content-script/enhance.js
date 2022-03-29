import browser from "../common/polyfill";
import { getDomainFrom } from "../common/util";
import { insertContentBlockStyle } from "./pageview/contentBlock";
import { iterateCSSOM } from "./pageview/cssom";
import { enablePageView } from "./pageview/enablePageView";
import { disableStyleChanges, enableStyleChanges } from "./style-changes";
import { insertBackground } from "./style-changes/background";
import { modifyBodyStyle } from "./style-changes/body";
import iterateDOM from "./style-changes/iterateDOM";
import { initTheme } from "./style-changes/theme";
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
        // Visibly hide noisy elements, and meanwhile perform heavy operation

        const start = performance.now();
        const [hideNoise, enableResponsiveStyle] = await iterateCSSOM();
        const duration = performance.now() - start;
        console.log(`Took ${Math.round(duration)}ms to iterate CSSOM`);

        hideNoise();

        // hide some noisy DOM elements with fade-out effect
        const [contentBlockFadeOut, contentBlockHide] =
            insertContentBlockStyle();
        contentBlockFadeOut();

        const [fadeOutDom, patchDom] = iterateDOM();
        fadeOutDom();

        initTheme(domain);
        insertBackground();

        // too small delay here causes jumping transitions
        await new Promise((r) => setTimeout(r, 600));

        // *** PageView transition phase ***
        // Shift layout and reduce page width in one go

        document.body.style.setProperty("transition", "all 0.5s");

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
