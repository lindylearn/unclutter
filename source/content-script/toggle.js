import browser from "webextension-polyfill";
import { insertContentBlockStyle } from "./pageview/contentBlock";
import { patchStylesheets } from "./pageview/patchStylesheets";
import {
    insertBackground,
    unPatchDocumentStyle,
} from "./pageview/styleChanges";

// listen to togglePageView events sent from background script
browser.runtime.onMessage.addListener(async (event) => {
    if (event === "ping") {
        return true;
    } else if (event === "togglePageView") {
        const isPageView =
            document.documentElement.classList.contains("pageview");
        if (!isPageView) {
            await enablePageView();
        } else {
            await disablePageView();
        }
    }
});

async function enablePageView() {
    insertBackground();
    patchStylesheets([...document.styleSheets]);
    insertContentBlockStyle();

    // make visible once set up
    document.documentElement.classList.add("pageview");

    // allow exiting pageview by clicking on background surrounding pageview (bare <html>)
    document.documentElement.onclick = (event) => {
        if (event.target.tagName === "HTML") {
            disablePageView();
        }
    };
}

export async function disablePageView() {
    // disable page view exiting
    document.documentElement.onclick = null;

    // immediately hide
    document.documentElement.classList.remove("pageview");

    await unPatchDocumentStyle();
}
