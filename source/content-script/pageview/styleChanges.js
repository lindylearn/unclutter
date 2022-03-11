import browser from "webextension-polyfill";
import { contentBlock, unContentBlock } from "./contentBlock";
import { insertOverrideRules, removeOverrideRules } from "./mediaQuery";

// slightly modify the CSS of the active website in order to make room for the annotations sidebar
export const overrideClassname = "lindylearn-document-override";
export function patchDocumentStyle() {
    insertBackground();
    insertPageViewStyle();
    insertOverrideRules();

    contentBlock();
    // insertShareButton();
}

export async function unPatchDocumentStyle() {
    // restore original styles first
    removeOverrideRules();
    await new Promise((resolve, _) => setTimeout(resolve, 0));

    // this removes most modifications
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());

    unContentBlock();
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

    // add miniscule top padding if not already present, to prevent top margin collapse
    document.body.style.paddingTop = ["", "0px"].includes(
        document.body.style.paddingTop
    )
        ? "0.05px"
        : document.body.style.paddingTop;

    createStylesheetLink(
        browser.runtime.getURL("/content-script/pageview/content.css")
    );
}

function insertBackground() {
    // create element of full height of all children, in case body height != content height
    var background = document.createElement("div");
    background.id = "lindy-body-background";
    background.className = `${overrideClassname} lindy-body-background`;

    // get page background to use
    const htmlBackground = window.getComputedStyle(
        document.documentElement
    ).background;
    const bodyBackground = window.getComputedStyle(document.body).background;
    let backgroundColor;
    if (bodyBackground && !bodyBackground.includes("rgba(0, 0, 0, 0)")) {
        backgroundColor = bodyBackground;
    } else if (htmlBackground && !htmlBackground.includes("rgba(0, 0, 0, 0)")) {
        backgroundColor = htmlBackground;
    } else {
        backgroundColor = "white";
    }
    background.style.background = backgroundColor;

    // body '100%' may not refer to full height of children (e.g. https://torontolife.com/memoir/the-horrifying-truth-about-my-biological-father/)
    background.style.height = `${document.body.scrollHeight}px`;
    document.body.appendChild(background);

    // update height after style fixes are done
    // TODO use MutationObserver or setTimeout(, 0) after style changes inserted?
    setTimeout(updateBackgroundHeight, 5000);
}

function updateBackgroundHeight() {
    // get height of body children to exclude background element itself
    // TODO exclude absolute positioned elements?
    const childHeights = [...document.body.children]
        .filter((node) => node.id !== "lindy-body-background")
        .map((node) => node.scrollHeight);

    const bodyHeigth = childHeights.reduce((sum, height) => sum + height, 0);

    const background = document.getElementById("lindy-body-background");
    background.style.height = `${bodyHeigth}px`;
}

export function createStylesheetLink(url) {
    var link = document.createElement("link");
    link.className = overrideClassname;
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
}

export function createStylesheetText(text) {
    var style = document.createElement("style");
    style.className = overrideClassname;
    style.type = "text/css";
    style.rel = "stylesheet";
    style.innerHTML = text;
    document.head.appendChild(style);
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
