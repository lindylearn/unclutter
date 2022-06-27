import browser from "../common/polyfill";
import { removeToast } from "../overlay/toast";
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

const transitions = new TransitionManager();
let disablePageView: () => void;
export async function togglePageView() {
    // manually toggle pageview status in this tab

    const alreadyEnabled =
        document.documentElement.classList.contains("pageview");

    if (!alreadyEnabled) {
        // enable extension

        // parse page
        await transitions.prepare();

        // perform modifications
        transitions.transitionIn();
        disablePageView = enablePageView();

        // prepare animation based on changed page layout
        requestAnimationFrame(() => {
            transitions.prepareAnimation();
        });
        await new Promise((r) => setTimeout(r, 10));

        // trigger computed animation
        transitions.executeAnimation();
        await new Promise((r) => setTimeout(r, 400 - 100));

        // later changes
        await transitions.afterTransitionIn();

        return true;
    } else {
        // disable extension (keeps some state for quicker re-enable)
        // generally perform changes in reverse order

        // undo ui enhancements
        transitions.beforeTransitionOut();
        await new Promise((r) => setTimeout(r, 10));

        // move text elements to original position
        transitions.executeReverseAnimation();
        await new Promise((r) => setTimeout(r, 400 - 100));

        // restore original page
        transitions.transitionOut();
        disablePageView();

        // later fixes
        await new Promise((r) => setTimeout(r, 100));
        transitions.afterTransitionOut();

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
