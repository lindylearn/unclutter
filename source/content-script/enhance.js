import browser from "../common/polyfill";
import {
    disableStyleChanges,
    enablePageView,
    enableStyleChanges,
} from "./pageview";
import { patchStylesheets } from "./pageview/patchStylesheets";

// additional functionality injected later

// listen to togglePageView events sent from background script
browser.runtime.onMessage.addListener(async (event) => {
    if (event === "ping") {
        return true;
    } else if (event === "togglePageView") {
        const isPageView =
            document.documentElement.classList.contains("pageview");
        if (!isPageView) {
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
