import { getCssOverride } from "./cssTweaks";
import { overrideClassname } from "./styleChanges";

// insert styles that adjust media query CSS to the reduced page width
export function insertOverrideRules() {
    const cssElems = [...document.getElementsByTagName("link")].filter(
        (elem) =>
            elem.rel === "stylesheet" && elem.className !== overrideClassname
    );

    cssElems.forEach(async (elem) => {
        const url = elem.href;
        try {
            const overrideCss = await getCssOverride(url, 1 / 0.6);

            createStylesheetText(overrideCss);
            disableStylesheet(elem);
        } catch (err) {
            console.error(`Error patching CSS file ${url}:`, err);
        }
    });
}
export function removeOverrideRules() {
    reenableOriginalStylesheets();
}

export function createStylesheetText(text) {
    var style = document.createElement("style");
    style.className = overrideClassname;
    style.type = "text/css";
    style.rel = "stylesheet";
    style.innerHTML = text;
    document.head.appendChild(style);
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
