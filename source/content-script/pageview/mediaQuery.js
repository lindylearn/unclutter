import { getCssOverride } from "./cssTweaks";
import { createStylesheetText, overrideClassname } from "./styleChanges";

// insert styles that adjust media query CSS to the reduced page width
export function insertOverrideRules() {
    const cssUrls = [...document.getElementsByTagName("link")]
        .filter(
            (elem) =>
                elem.rel === "stylesheet" &&
                elem.className !== overrideClassname
        )
        .map((elem) => elem.href);

    // console.log(cssUrls);

    cssUrls.forEach(async (url) => {
        try {
            const overrideCss = await getCssOverride(url, 1 / 0.6);

            createStylesheetText(overrideCss);
        } catch (err) {
            console.error("Error updating CSS media queries:", err);
        }
    });
}
