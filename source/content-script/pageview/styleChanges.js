import browser from "../../common/polyfill";

export const overrideClassname = "lindylearn-document-override";

// Perform various fixes to a site's body tag, to improve the page view display
export function modifyBodyStyle() {
    // set start properties for animation immediately
    document.body.style.width = "100%";
    // document.body.style.margin = "0";
    // document.body.style.maxWidth = "none";

    // set animation style inline to have out transition
    // easeOutExpo from easings.net
    document.body.style.transition = `margin-top 0.15s cubic-bezier(0.16, 1, 0.3, 1),
	margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1),
	width 0.3s cubic-bezier(0.16, 1, 0.3, 1)`;

    const bodyStyle = window.getComputedStyle(document.body);

    // add miniscule top padding if not already present, to prevent top margin collapse
    // note that body margin is rewritten into padding in cssTweaks.ts
    if (["", "0px"].includes(bodyStyle.paddingTop)) {
        document.body.style.paddingTop = "0.05px";
    }
    // add some minimal padding if none present (0 padding looks quite ugly)
    if (["", "0px"].includes(bodyStyle.paddingLeft)) {
        document.body.style.paddingLeft = "20px";
        document.body.style.paddingRight = "20px";
    }

    // html or body tags may have classes with fixed style applied (which we hide via css rewrite)
    document.documentElement.style.setProperty("display", "block", "important");
    document.body.style.setProperty("display", "block", "important");

    // set inline styles to overwrite scroll-locks
    document.documentElement.style.setProperty(
        "position",
        "relative",
        "important"
    );
    document.documentElement.style.setProperty(
        "overflow-y",
        "scroll",
        "important"
    );
    document.body.style.setProperty("height", "auto", "important");
    document.body.style.setProperty("margin", "10px auto", "important");
}

// Insert an element behind a site's <body> content to show a white background if the page doesn't provide it.
// The height of this element needs to be dynamically kept in sync with the body height.
export function insertBackground() {
    // create element of full height of all children, in case body height != content height
    var background = document.createElement("div");
    background.id = "lindy-body-background";
    background.className = `${overrideClassname} lindy-body-background`;

    // get page background to use
    // const htmlBackground = window.getComputedStyle(
    //     document.documentElement
    // ).background;
    const bodyBackground = window.getComputedStyle(document.body).background;
    let backgroundColor;
    if (bodyBackground && !bodyBackground.includes("rgba(0, 0, 0, 0)")) {
        backgroundColor = bodyBackground;

        // else if (htmlBackground && !htmlBackground.includes("rgba(0, 0, 0, 0)")) {
        //     backgroundColor = htmlBackground;
        // }
    } else {
        backgroundColor = "white";
    }
    background.style.setProperty("background", backgroundColor, "important");

    // body '100%' may not refer to full height of children (e.g. https://torontolife.com/memoir/the-horrifying-truth-about-my-biological-father/)
    background.style.setProperty(
        "height",
        `${document.body.scrollHeight}px`,
        "important"
    );

    // observe children height changes
    const observer = new ResizeObserver(function () {
        _updateBackgroundHeight();
    });
    [...document.body.children].map((node) => observer.observe(node));

    document.body.appendChild(background);
}

function _updateBackgroundHeight() {
    // get height of body children to exclude background element itself
    // TODO exclude absolute positioned elements?
    const childHeights = [...document.body.children]
        .filter((node) => node.id !== "lindy-body-background")
        .map((node) => node.scrollHeight);

    const bodyHeigth = childHeights.reduce((sum, height) => sum + height, 0);

    const background = document.getElementById("lindy-body-background");
    if (background) {
        background.style.setProperty("height", `${bodyHeigth}px`, "important");
    }
}

// Insert a small UI for the user to control the automatic pageview enablement on the current domain.
export function insertDomainToggle() {
    const url = new URL(window.location.href);
    const domain = url.hostname.replace("www.", "");

    const iframeUrl = new URL(
        browser.runtime.getURL("content-script/switch/index.html")
    );
    iframeUrl.searchParams.append("domain", domain);

    var iframe = document.createElement("iframe");
    iframe.src = iframeUrl.toString();
    iframe.className = `${overrideClassname} lindy-domain-switch`;
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameBorder", "0");
    iframe.setAttribute("allowTransparency", "true");

    document.documentElement.appendChild(iframe);
}

// Insert text behind the <body> background in case the site fails to render.
export function insertReportButton() {
    const div = document.createElement("div");
    div.className = `${overrideClassname} report-broken`;
    div.innerHTML =
        ":( Page broken?<br />Please report it <a href='https://github.com/lindylearn/reader-extension/issues/new' target='_blank' rel='noopener noreferrer'>on GitHub</a>.";
    document.documentElement.appendChild(div);
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

export function createStylesheetLink(url) {
    var link = document.createElement("link");
    link.classList.add(overrideClassname);
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
}

export function createStylesheetText(text, styleId) {
    var style = document.createElement("style");
    style.classList.add(overrideClassname);
    style.classList.add(styleId);
    style.type = "text/css";
    style.rel = "stylesheet";
    style.innerHTML = text;
    document.head.appendChild(style);
}
