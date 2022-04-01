import browser from "../common/polyfill";
import { enablePageView } from "./pageview/enablePageView";
import TransitionManager from "./transitions";

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
        const transitions = new TransitionManager();
        await transitions.prepare();

        // wait up to 200ms for animation completion
        // don't wait after very long parsing time
        await Promise.all([
            transitions.fadeOutNoise(),
            // new Promise((r) => setTimeout(r, 0)),
        ]);

        await transitions.transitionIn();

        isSimulatedClick = false;
        await enablePageView(async () => {
            // when user exists page view

            if (!isSimulatedClick) {
                // already emitted elsewhere for simulated non-background clicks
                browser.runtime.sendMessage(null, {
                    event: "disabledPageView",
                    trigger: "backgroundClick",
                });
            }

            await transitions.transitionOut();
            await transitions.fadeinNoise();
        }, true);

        await transitions.afterTransitionIn();
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
        togglePageView();
        return;
    }
    // use normal enhance workflow for now

    // console.log("enhance page");

    // const domain = getDomainFrom(new URL(window.location.href));

    // const [contentBlockFadeOut, contentBlockHide, contentBlockFadeIn] =
    //     insertContentBlockStyle();

    // const [fadeOutDom, patchDom] = iterateDOM();
    // fadeOutDom();

    // initTheme(domain);
    // insertBackground();

    // pageViewTransition(domain, () => {}, contentBlockHide, patchDom);

    // // attach additional style unpatch functionality on pageview hide
    // document.documentElement.addEventListener(
    //     "click",
    //     (event) => {
    //         if (event.target.tagName === "HTML") {
    //             disableStyleChanges();
    //         }
    //     },
    //     true
    // );
}
enhance();
