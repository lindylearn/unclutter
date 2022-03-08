import browser from "webextension-polyfill";
import { insertOverrideRules } from "./mediaQuery";

// slightly modify the CSS of the active website in order to make room for the annotations sidebar
const overrideClassname = "lindylearn-document-override";
export function patchDocumentStyle() {
    insertPageViewStyle();
    insertOverrideRules();
    insertShareButton();
}

export function unPatchDocumentStyle() {
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());
}

// add style to show the sidebar
function insertPageViewStyle() {
    // set start properties for animation immediately
    document.body.style.width = "100%";
    document.body.style.margin = "0";

    // set animation style inline to have ease-out
    // easeOutExpo from easings.net
    document.body.style.transition = `margin-top 0.15s cubic-bezier(0.16, 1, 0.3, 1),
	margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1),
	width 0.3s cubic-bezier(0.16, 1, 0.3, 1)`;

    createStylesheetLink(
        browser.runtime.getURL("/content-script/pageview/content.css")
    );

    // create element of full height of all children, in case body height != content height
    // TODO update this height on page update
    var el = document.createElement("div");
    el.className = `${overrideClassname} body-background`;
    el.style.height = `${document.body.scrollHeight}px`;
    const siteBackground = window.getComputedStyle(document.body).background;
    el.style.background = siteBackground.includes("rgba(0, 0, 0, 0)")
        ? "white"
        : siteBackground;
    document.body.appendChild(el);
}

export function createStylesheetLink(url) {
    var link = document.createElement("link");
    link.className = overrideClassname;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
}

// button to share the annotations of the active page
function insertShareButton() {
    var a = document.createElement("a");
    a.href = `https://annotations.lindylearn.io/page?url=${window.location.href}`;
    a.className = `${overrideClassname} share-icon`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);

    var img = document.createElement("img");
    img.src = browser.runtime.getURL("assets/icons/share.svg");
    a.appendChild(img);
}
