import browser from "../../common/polyfill";
import { createStylesheetText, overrideClassname } from "./styleChanges";

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
    return () => observer.disconnect.bind(observer);
}

export async function patchStylesheets(newStylesheets) {
    const newStylesheetsToPatch = newStylesheets
        .map((sheet) => sheet.ownerNode)
        .filter(
            (node) =>
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

export async function patchStylesheetNode(elem, conditionScale) {
    // random id to corraborate original & override style
    const styleId = `style_${Math.random()}`;
    try {
        let inlineCss;
        if (elem.tagName !== "LINK") {
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
        const overrideCss = await rewriteCssRemote({
            styleId: styleId,
            cssUrl: elem.href,
            cssInlineText: inlineCss,
            baseUrl: window.location.href,
            conditionScale: conditionScale,
        });
        console.log(overrideCss);
        const duration = performance.now() - start;
        console.log(
            `Took ${Math.round(duration)}ms to rewrite ${
                elem.href || "inline style"
            } '${styleId}'`
        );

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

async function rewriteCssRemote(params) {
    const response = await browser.runtime.sendMessage(null, {
        event: "rewriteCss",
        params,
    });
    if (response.status === "success") {
        return response.css;
    }
    console.error(response);
    throw Error(response);
}

const disabledClassname = "lindylearn-disabled-style";
function disableStylesheet(elem, styleId) {
    elem.disabled = true;
    elem.classList.add(disabledClassname);
    elem.classList.add(styleId);
}

export function unPatchStylesheets() {
    reenableOriginalStylesheets();
}

function reenableOriginalStylesheets() {
    [...document.getElementsByClassName(disabledClassname)].map((elem) => {
        elem.classList.remove(disabledClassname);
        elem.disabled = false;
    });
}
