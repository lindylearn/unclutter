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

browser.runtime.onMessage.addListener((event) => {
    if (event === "togglePageView") {
        togglePageView();
    } else {
        console.log(event);
    }
});

async function togglePageView() {
    const isInPageView = document.body.classList.contains("pageview");
    if (!isInPageView) {
        await enable();
    } else {
        await disable();
    }
}

async function enable() {
    patchDocumentStyle();
    const sidebarIframe = injectSidebar();

    createAnnotationListener(sidebarIframe);
    createSelectionListener(sidebarIframe);

    // make visible once set up
    document.body.classList.add("pageview");
}
async function disable() {
    // immediately hide
    document.body.classList.remove("pageview");

    unPatchDocumentStyle();
    removeSidebar();

    removeAnnotationListener();
    removeSelectionListener();
}
