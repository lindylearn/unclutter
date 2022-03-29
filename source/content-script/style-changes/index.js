import { unPatchStylesheets } from "../pageview/patchStylesheets";
import { overrideClassname } from "./background";
import { unModifyBodyStyle } from "./body";

// tweak a site's style dynamically
export async function enableStyleChanges() {
    // set up theme variables, does not apply them yet
    // insert background that respects theme variables, may be overshadowed by text containers
    // set inline styles to overwrite conflicting site styles
    // re-applies some pageview styles, so run after pageview enabled
    // modifyBodyStyle();
    // this will remove all text side margin, so wait until pageview enabled
    // setTimeout(iterateDOM, 100);
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
