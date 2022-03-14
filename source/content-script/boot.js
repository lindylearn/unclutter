// setup listeners on document_start

import { shouldEnableForDomain } from "../common/storage";
import { insertContentBlockStyle } from "./pageview/contentBlock";
import { patchStylesheets } from "./pageview/patchStylesheets";
import {
    insertBackground,
    insertDomainToggle,
    modifyBodyStyle,
} from "./pageview/styleChanges";
import { disablePageView } from "./toggle";

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

    // base css is already injected, activate it by adding class
    // add to <html> element since <body> not contructed yet
    document.documentElement.classList.add("pageview");

    // ensure pageview class stays active (e.g. nytimes JS replaces classes)
    const observer = new MutationObserver((mutations, observer) => {
        if (!mutations[0].target.classList.contains("pageview")) {
            document.documentElement.classList.add("pageview");
        }
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });

    // listen to created stylesheet elements
    const unobserveStyle = patchStylesheetsOnceCreated();

    // allow exiting pageview by clicking on background surrounding pageview (bare <html>)
    document.documentElement.onclick = (event) => {
        if (event.target.tagName === "HTML") {
            observer.disconnect();
            unobserveStyle();
            disablePageView();
        }
    };

    // once dom loaded, do rest of style tweaks
    document.onreadystatechange = async function () {
        if (document.readyState === "interactive") {
            insertBackground();
            insertContentBlockStyle();

            // await patchStylesheets([...document.styleSheets]);

            // patch after new style applied
            modifyBodyStyle();

            insertDomainToggle(domain);
        }
    };
}

boot();

// listen to new stylesheet dom nodes, and start their patch process immediately
function patchStylesheetsOnceCreated() {
    const seenStylesheets = new Set();
    const observer = new MutationObserver((mutations, observer) => {
        const stylesheets = [...document.styleSheets];

        const newStylesheets = stylesheets.filter(
            (sheet) => !seenStylesheets.has(sheet)
        );
        newStylesheets.map((sheet) => seenStylesheets.add(sheet));

        patchStylesheets(newStylesheets);
    });
    observer.observe(document, { childList: true, subtree: true });
    // executing site JS may add style elements, e.g. cookie banners
    // so continue listening for new stylesheets
    return () => observer.disconnect.bind(observer);
}
