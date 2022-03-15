// setup listeners on document_start

import browser from "../common/polyfill";
import { shouldEnableForDomain } from "../common/storage";
import { enablePageView } from "./pageview/enablePageView";
import { patchStylesheetsOnceCreated } from "./pageview/patchStylesheets";

// optimized version of enablePageView() that runs in every user tab
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

    // enable "page view" width restriction immediately before first render
    enablePageView(() => {
        // when user exists page view, disable rewrites
        unobserveRewrite();
    });

    // request injection of additional extension functionality
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
    });
}

boot();
