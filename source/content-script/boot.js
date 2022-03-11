// setup listeners on document_start

import { patchStylesheetNode } from "./pageview/mediaQuery";
import { overrideClassname, patchDocumentStyle } from "./pageview/styleChanges";

const excludedHosts = ["google.com", "news.ycombinator.com", "twitter.com"];

async function boot() {
    // check if extension should be enabled on this page
    const url = new URL(window.location.href);
    const hostname = url.hostname.replace("www.", "");
    if (excludedHosts.includes(hostname)) {
        return;
    }

    // base css is already injected, activate it by adding class
    // add to <html> element since <body> not contructed yet
    document.documentElement.classList.add("pageview");

    // allow exiting pageview by clicking on background surrounding pageview (bare <html>)
    document.documentElement.onclick = (event) => {
        if (event.target.tagName === "HTML") {
            document.documentElement.classList.remove("pageview");
        }
    };

    // listen to new stylesheet dom nodes, and start their patch process immediately (before entire dom constructed)
    let lastStylesheetCount = 0;
    const observer = new MutationObserver((mutations, observer) => {
        // TODO is iterating through mutations list faster?
        const stylesheets = [...document.styleSheets];
        const newStylesheets = stylesheets.slice(lastStylesheetCount);
        lastStylesheetCount = stylesheets.length;
        if (newStylesheets.length === 0) {
            return;
        }

        // document.styleSheets already only considers media queries on stylesheet level
        const newStylesheetsToPatch = newStylesheets.filter(
            (sheet) =>
                !sheet.disabled &&
                sheet.ownerNode?.className !== overrideClassname
        );
        console.log(Date.now(), "newStylesheetsToPatch", newStylesheetsToPatch);

        const conditionScale = window.innerWidth / 750;
        newStylesheetsToPatch.map((sheet) =>
            patchStylesheetNode(sheet.ownerNode, conditionScale)
        );
    });
    observer.observe(document, { childList: true, subtree: true });
    // executing site JS may add style elements, e.g. cookie banners. so wait a bit.
    window.onload = (e) => setTimeout(observer.disconnect.bind(observer), 3000);

    document.onreadystatechange = function () {
        if (document.readyState === "interactive") {
            patchDocumentStyle();
        }
    };

    // setup cleanup code
    // add background element, listener

    // generate content block css
    // insert page-specific tweaks css
}
boot();
