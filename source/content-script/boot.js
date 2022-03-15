import browser from "../common/polyfill";
import { shouldEnableForDomain } from "../common/storage";
import { enablePageView } from "./pageview/enablePageView";
import { patchStylesheetsOnceCreated } from "./pageview/patchStylesheets";

// script injected into every tab before dom constructed
// if configured by the user, initialize the extension funcationality
async function boot() {
    // check if extension should be enabled on this page
    const url = new URL(window.location.href);
    if (url.pathname === "/") {
        return;
    }
    const domain = url.hostname.replace("www.", "");
    if (!(await shouldEnableForDomain(domain))) {
        return;
    }

    // rewrite stylesheets immediately once created
    const unobserveRewrite = patchStylesheetsOnceCreated();

    // enable basic "page view" style changes immediately
    enablePageView(() => {
        // when user exists page view, stop rewriting new stylesheets
        unobserveRewrite();
    });

    // request injection of additional extension functionality
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
    });
}

boot();
