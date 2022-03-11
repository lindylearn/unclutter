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
        } else {
            cssText = elem.innerHTML;
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
