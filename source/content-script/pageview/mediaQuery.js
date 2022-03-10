import axios from "axios";
import { getCssOverride } from "./cssTweaks";
import { createStylesheetText, overrideClassname } from "./styleChanges";

const proxyUrl = "https://annotations.lindylearn.io/proxy";

// insert styles that adjust media query CSS to the reduced page width
export async function insertOverrideRules() {
    // keep in sync with body width set via css
    // ideally, update when page resizes (but that would require regenering the css)
    const conditionScale = window.innerWidth / 750; // 1 / 0.5;

    const cssElems = [
        ...document.getElementsByTagName("link"),
        ...document.getElementsByTagName("style"),
    ]
        .filter(
            (elem) =>
                elem.tagName === "STYLE" ||
                (elem.tagName === "LINK" &&
                    elem.rel === "stylesheet" &&
                    elem.media !== "print") // to be correct, we should parse this media query
        )
        .filter((elem) => elem.className !== overrideClassname);

    await Promise.all(
        cssElems.map(async (elem) => {
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

                const overrideCss = await getCssOverride(
                    url,
                    cssText,
                    conditionScale
                );

                createStylesheetText(overrideCss);
                disableStylesheet(elem);
            } catch (err) {
                console.error(`Error patching CSS file ${url}:`, err);
            }
        })
    );
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
