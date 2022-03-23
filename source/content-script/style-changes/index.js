import { insertContentBlockStyle } from "../pageview/contentBlock";
import { unPatchStylesheets } from "../pageview/patchStylesheets";
import insert from "../switch/insert";
import { insertBackground, overrideClassname } from "./background";
import { modifyBodyStyle, unModifyBodyStyle } from "./body";
import iterateDOM from "./iterateDOM";

// tweak a site's style dynamically
export async function enableStyleChanges() {
    insertBackground();
    insertContentBlockStyle();

    // patch after new style applied
    modifyBodyStyle();

    insert();
    // insertPageBrokenText();

    iterateDOM();
}
export async function disableStyleChanges() {
    // restore original styles first
    unPatchStylesheets();

    // remove most modifications
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());

    // remove body style overrides last, as they include the animation settings
    await new Promise((r) => setTimeout(r, 200));
    unModifyBodyStyle();
}
