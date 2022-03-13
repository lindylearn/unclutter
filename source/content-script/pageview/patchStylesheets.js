import axios from "axios";
import { getCssOverride } from "./cssTweaks";
import { createStylesheetText, overrideClassname } from "./styleChanges";

const proxyUrl = "https://annotations.lindylearn.io/proxy";

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
    const url = elem.href || window.location.href;
    try {
        let cssText;
        if (elem.tagName === "LINK") {
            const response = await axios.get(
                `${proxyUrl}/${encodeURIComponent(url)}`,
                {
                    responseType: "blob",
                }
            );
            cssText = await response.data.text();
        } else if (elem.innerHTML) {
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
            cssText = elem.innerHTML;
        } else {
            // style rules created through javascript, e.g. via styled-components
            // see https://developer.chrome.com/blog/css-in-js/
            cssText = [...elem.sheet.cssRules]
                .map((rule) => rule.cssText)
                .join("\n");
        }
        if (!cssText) {
            return;
        }

        const start = performance.now();
        const overrideCss = await getCssOverride(url, cssText, conditionScale);
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
