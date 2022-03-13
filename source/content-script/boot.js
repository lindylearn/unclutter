// setup listeners on document_start

import { insertContentBlockStyle } from "./pageview/contentBlock";
import { patchStylesheets } from "./pageview/patchStylesheets";
import { insertBackground, modifyBodyStyle } from "./pageview/styleChanges";
import { disablePageView } from "./toggle";

const excludedHosts = [
    "google.com",
    "keep.google.com",
    "calendar.google.com",
    "drive.google.com",
    "mail.google.com",
    "mail.protonmail.com",
    "youtube.com",
    "news.ycombinator.com",
    "twitter.com",
    "linkedin.com",
    "reddit.com",
    "github.com",
    "stackoverflow.com",
    "developer.mozilla.org",
];

// optimized version of enablePageView() that runs in every user tab
function boot() {
    // check if extension should be enabled on this page
    const url = new URL(window.location.href);
    const hostname = url.hostname.replace("www.", "");
    if (excludedHosts.includes(hostname)) {
        return;
    }
    if (url.pathname === "/") {
        return;
    }

    // base css is already injected, activate it by adding class
    // add to <html> element since <body> not contructed yet
    document.documentElement.classList.add("pageview");

    // allow exiting pageview by clicking on background surrounding pageview (bare <html>)
    document.documentElement.onclick = (event) => {
        if (event.target.tagName === "HTML") {
            disablePageView();
        }
    };

    // listen to created stylesheet elements
    patchStylesheetsOnceCreated();

    // once dom loaded, do rest of style tweaks
    document.onreadystatechange = async function () {
        if (document.readyState === "interactive") {
            insertBackground();
            insertContentBlockStyle();

            // await patchStylesheets([...document.styleSheets]);

            // patch after new style applied
            modifyBodyStyle();

            // insertDomainToggle(hostname);
        }
    };
}

boot();

// listen to new stylesheet dom nodes, and start their patch process immediately
function patchStylesheetsOnceCreated() {
    let lastStylesheetCount = 0;
    const observer = new MutationObserver((mutations, observer) => {
        // TODO is iterating through mutations list faster?
        const stylesheets = [...document.styleSheets];
        const newStylesheets = stylesheets.slice(lastStylesheetCount);
        lastStylesheetCount = stylesheets.length;
        if (newStylesheets.length === 0) {
            return;
        }

        patchStylesheets(newStylesheets);
    });
    observer.observe(document, { childList: true, subtree: true });
    // executing site JS may add style elements, e.g. cookie banners. so wait a bit.
    // window.onload = (e) => setTimeout(observer.disconnect.bind(observer), 3000);
}
