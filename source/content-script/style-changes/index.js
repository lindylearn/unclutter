import { insertContentBlockStyle } from "../pageview/contentBlock";
import { unPatchStylesheets } from "../pageview/patchStylesheets";
import { insertDomainToggle } from "../switch/insert";
import { insertBackground, overrideClassname } from "./background";
import { modifyBodyStyle } from "./body";
import { insertReportButton } from "./insert";

// tweak a site's style dynamically
export async function enableStyleChanges() {
    insertBackground();
    insertContentBlockStyle();

    // patch after new style applied
    modifyBodyStyle();

    insertDomainToggle();
    insertReportButton();
}
export async function disableStyleChanges() {
    // restore original styles first
    unPatchStylesheets();

    // remove most modifications
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());
}
