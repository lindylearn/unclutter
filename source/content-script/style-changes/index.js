import { insertContentBlockStyle } from "../pageview/contentBlock";
import { unPatchStylesheets } from "../pageview/patchStylesheets";
import insert from "../switch/insert";
import { insertBackground, overrideClassname } from "./background";
import { modifyBodyStyle, unModifyBodyStyle } from "./body";

// tweak a site's style dynamically
export async function enableStyleChanges() {
    insertBackground();
    insertContentBlockStyle();

    // patch after new style applied
    modifyBodyStyle();

    insert();
    // insertPageBrokenText();
}
export async function disableStyleChanges() {
    // restore original styles first
    unPatchStylesheets();

    unModifyBodyStyle();

    // remove most modifications
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());
}
