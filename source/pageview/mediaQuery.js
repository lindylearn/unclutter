import { mediaQueryFunction } from "../common/api";
import { createStylesheetLink } from "./styleChanges";

// insert styles that adjust media query CSS to the reduced page width
export function insertOverrideRules() {
    const cssUrls = [...document.getElementsByTagName("link")]
        .filter((elem) => elem.rel === "stylesheet")
        .map((elem) => elem.href);

    cssUrls.forEach((url) => {
        createStylesheetLink(
            `${mediaQueryFunction}?cssUrl=${encodeURIComponent(
                url
            )}&conditionScale=${1.6}`
        );
    });
}
