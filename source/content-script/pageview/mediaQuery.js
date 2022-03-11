import axios from "axios";
import { getCssOverride } from "./cssTweaks";
import { createStylesheetText } from "./styleChanges";

const proxyUrl = "https://annotations.lindylearn.io/proxy";

export async function patchStylesheetNode(elem, conditionScale) {
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

        const overrideCss = await getCssOverride(url, cssText, conditionScale);

        createStylesheetText(overrideCss);
        disableStylesheet(elem);
    } catch (err) {
        console.error(`Error patching CSS file ${url}:`, err);
    }
}

export function removeOverrideRules() {
    reenableOriginalStylesheets();
}

const disabledClassname = "lindylearn-disabled-style";
function disableStylesheet(elem) {
    elem.disabled = true;
    elem.classList.add(disabledClassname);
}

function reenableOriginalStylesheets() {
    [...document.getElementsByClassName(disabledClassname)].map((elem) => {
        elem.classList.remove(disabledClassname);
        elem.disabled = false;
    });
}
