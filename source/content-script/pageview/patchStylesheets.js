import browser from "../../common/polyfill";
import {
    createStylesheetText,
    overrideClassname,
} from "../style-changes/common";

// listen to new stylesheet dom nodes, and start their patch process immediately
export function patchStylesheetsOnceCreated() {
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
    return () => observer.disconnect();
}

// patch a set of stylesheet elements
export async function patchStylesheets(newStylesheets) {
    const newStylesheetsToPatch = newStylesheets
        .map((sheet) => sheet.ownerNode)
        .filter(
            (node) =>
                node &&
                !node.classList.contains(overrideClassname) &&
                !node.classList.contains(disabledClassname)
        );

    const conditionScale = window.innerWidth / 750;
    await Promise.all(
        newStylesheetsToPatch.map((node) =>
            patchStylesheetNode(node, conditionScale)
        )
    );
}

// Patch (parse, tweak, re-serialize) the CSS of a specific <style> or <link> DOM node.
// This is done to improve the readability of text content, and not always possible through the CSSOM api.
// This function communicates with the background service worker where we run the actual patching.
// See `background/rewriteCss.js`.
export async function patchStylesheetNode(elem, conditionScale) {
    // random id to corraborate original & override style
    const styleId = `style_${Math.random().toString().slice(2)}`;
    try {
        if (elem.tagName === "LINK") {
            // exclude font stylesheets
            /**
             * e.g.
             * https://fonts.googleapis.com/css?family=Open+Sans%3A300%2C300italic%2C600%2C600italic&ver=5.9.2
             * https://sites.lsa.umich.edu/mje/wp-content/themes/astrid/fonts/font-awesome.min.css?ver=5.9.2
             * https://pro.fontawesome.com/releases/v5.3.1/css/all.css
             * https://www.newyorker.comhttps//www.newyorker.com/verso/static/assets/fonts/NeutrafaceNewYorker-SemiBold.woff2
             */

            const url = new URL(elem.href);
            if (
                ["fonts.googleapis.com", "pro.fontawesome.com"].includes(
                    url.hostname
                )
            ) {
                return;
            }
            if (
                url.pathname.includes("font") ||
                url.pathname.endsWith(".woff2")
            ) {
                return;
            }
        }

        let inlineCss;
        if (elem.tagName !== "LINK") {
            // get inline css
            if (elem.innerHTML) {
                if (
                    elem.attributes["data-styled"] ||
                    elem.attributes["data-emotion"]
                ) {
                    // skip rewrite of styled-components inline content
                    // these will be injected via CSSOM and processed by elem.sheet.cssRules below
                    console.log(
                        "Skipping rewrite of inline styled-components",
                        elem
                    );
                    return;
                }
                inlineCss = elem.innerHTML;
            } else {
                // style rules created through javascript, e.g. via styled-components
                // see https://developer.chrome.com/blog/css-in-js/
                inlineCss = [...elem.sheet.cssRules]
                    .map((rule) => rule.cssText)
                    .join("\n");
            }
            if (!inlineCss) {
                return;
            }
        }

        const start = performance.now();

        // rewrite css in service worker
        const overrideCss = await rewriteCssRemote({
            styleId: styleId,
            cssUrl: elem.href,
            cssInlineText: inlineCss,
            baseUrl: elem.href || window.location.href,
            conditionScale: conditionScale,
        });

        const duration = performance.now() - start;
        console.log(
            `Took ${Math.round(duration)}ms to rewrite ${
                elem.href || "inline style"
            } '${styleId}'`
        );

        // create new dom node for rewritten css, and disable the old style
        // this is undone when the user disables the pageview
        createStylesheetText(overrideCss, styleId);
        disableStylesheet(elem, styleId);
    } catch (err) {
        console.error(
            `Error rewriting ${elem.href || "inline style"} '${styleId}'`,
            elem,
            err
        );
    }
}

// Send an event to the extensions service worker to rewrite a stylesheet, and wait for a response.
async function rewriteCssRemote(params) {
    const response = await browser.runtime.sendMessage(null, {
        event: "rewriteCss",
        params,
    });
    if (response.status === "success") {
        return response.css;
    }
    if (response.status === "error") {
        throw response.err;
    }
    throw Error(response);
}

// Re-enable all original stylesheets on a page.
export function unPatchStylesheets() {
    reenableOriginalStylesheets();
}

const disabledClassname = "lindylearn-disabled-style";
function disableStylesheet(elem, styleId) {
    elem.disabled = true;
    elem.classList.add(disabledClassname);
    elem.classList.add(styleId);
}

function reenableOriginalStylesheets() {
    [...document.getElementsByClassName(disabledClassname)].map((elem) => {
        elem.classList.remove(disabledClassname);
        elem.disabled = false;
    });
}
