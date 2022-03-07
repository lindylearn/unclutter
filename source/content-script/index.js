import browser from "webextension-polyfill";
import { injectSidebar, removeSidebar } from "../pageview/injectSidebar";
import {
    patchDocumentStyle,
    unPatchDocumentStyle,
} from "../pageview/styleChanges";
import {
    createAnnotationListener,
    removeAnnotationListener,
} from "./annotationListener";
import {
    createSelectionListener,
    removeSelectionListener,
} from "./selectionListener";

// listen to togglePageView events sent from background script
browser.runtime.onMessage.addListener((event) => {
    if (event === "togglePageView") {
        togglePageView();
    } else {
        console.log(event);
    }
});

// toggle the "page view" for the current tab.
// the "page view" includes the web annotations sidebar iframe and CSS changes that make the sidebar visible
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
    const sidebarIframe = injectSidebar();

    // listen and react to annotation events from the sidebar iframe
    createAnnotationListener(sidebarIframe);
    createSelectionListener(sidebarIframe);

    // make visible once set up
    document.body.classList.add("pageview");
}
async function disablePageView() {
    // immediately hide
    document.body.classList.remove("pageview");

    unPatchDocumentStyle();
    removeSidebar();

    removeAnnotationListener();
    removeSelectionListener();
}
