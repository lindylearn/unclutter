import browser from "../common/polyfill";
import { removeToast } from "./overlay/toast";
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
        togglePageView().then((enabledNow) => {
            if (!enabledNow) {
                browser.runtime.sendMessage(null, {
                    event: "disabledPageView",
                    trigger: "extensionIcon",
                    pageHeightPx: document.body.clientHeight,
                });
            }
        });

        return false;
    }
});

let isSimulatedClick = false;
export async function togglePageView() {
    // manually toggle pageview status in this tab

    const alreadyEnabled =
        document.documentElement.classList.contains("pageview");

    if (!alreadyEnabled) {
        const transitions = new TransitionManager();
        await transitions.prepare();

        transitions.fadeOutNoise();

        transitions.transitionIn();

        // await new Promise((r) => setTimeout(r, 1000));

        isSimulatedClick = false;
        await enablePageView(async () => {
            // when user exists page view

            if (!isSimulatedClick) {
                // already emitted elsewhere for simulated non-background clicks
                browser.runtime.sendMessage(null, {
                    event: "disabledPageView",
                    trigger: "backgroundClick",
                    pageHeightPx: document.body.clientHeight,
                });
            }

            await transitions.transitionOut();
            await new Promise((r) => setTimeout(r, 200));

            await transitions.fadeinNoise();
            await new Promise((r) => setTimeout(r, 200));

            await transitions.afterTransitionOut();
        }, true);

        await new Promise((r) => setTimeout(r, 200));

        await transitions.afterTransitionIn();
        return true;
    } else {
        // hack: simulate click to call disable handlers with correct state (also from boot.js)
        isSimulatedClick = true;
        document.documentElement.click();
        return false;
    }
}

// perform style changes if pageview was already triggered by boot.js
async function enhance() {
    const pageViewEnabled =
        document.documentElement.classList.contains("pageview");

    if (!pageViewEnabled) {
        removeToast();
        togglePageView();
    }
}
enhance();
