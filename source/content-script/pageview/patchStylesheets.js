import axios from "axios";
import { getCssOverride } from "./cssTweaks";
import { createStylesheetText, overrideClassname } from "./styleChanges";

const proxyUrl = "https://annotations.lindylearn.io/proxy";

export async function patchStylesheets(newStylesheets) {
    const newStylesheetsToPatch = newStylesheets.filter(
        (sheet) =>
            !sheet.disabled && sheet.ownerNode?.className !== overrideClassname
    );

    const conditionScale = window.innerWidth / 750;
    await Promise.all(
        newStylesheetsToPatch.map((sheet) =>
            patchStylesheetNode(sheet.ownerNode, conditionScale)
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
            cssText = elem.innerHTML;
        } else {
            // stylesheet rules that were created through js
            // which means they are accessible to us too

            // TODO optimize this, don't do the parsing or at least rule splitting for js rules?
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
        console.error(`Error patching CSS file ${url}:`, err);
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
