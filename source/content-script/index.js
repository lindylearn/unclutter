import browser from "webextension-polyfill";
import {
    patchDocumentStyle,
    unPatchDocumentStyle,
} from "./pageview/styleChanges";

// listen to togglePageView events sent from background script
browser.runtime.onMessage.addListener(async (event) => {
    if (event === "ping") {
        return true;
    } else if (event === "togglePageView") {
        await togglePageView();
    } else {
        console.log(event);
    }
});

// toggle the "page view" for the current tab.
async function togglePageView() {
    const isInPageView = document.body.classList.contains("pageview");
    if (!isInPageView) {
        await enablePageView();
    } else {
        await disablePageView();
    }
}

async function enablePageView() {
    patchDocumentStyle();

    // make visible once set up
    document.body.classList.add("pageview");

    // allow exiting pageview by clicking on background surrounding pageview (bare <html>)
    document.onclick = (event) => {
        if (event.target.tagName === "HTML") {
            togglePageView();
        }
    };
}
async function disablePageView() {
    // disable page view exiting
    document.onclick = null;

    // immediately hide
    document.body.classList.remove("pageview");

    await unPatchDocumentStyle();
}
