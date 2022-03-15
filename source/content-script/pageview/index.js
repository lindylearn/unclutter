import { insertContentBlockStyle } from "./contentBlock";
import { unPatchStylesheets } from "./patchStylesheets";
import {
    insertBackground,
    insertDomainToggle,
    insertReportButton,
    modifyBodyStyle,
    overrideClassname,
} from "./styleChanges";

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
