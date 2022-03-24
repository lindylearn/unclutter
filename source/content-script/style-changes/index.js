import { getDomainFrom } from "../../common/util";
import { insertContentBlockStyle } from "../pageview/contentBlock";
import { unPatchStylesheets } from "../pageview/patchStylesheets";
import insert from "../switch/insert";
import { insertBackground, overrideClassname } from "./background";
import { modifyBodyStyle, unModifyBodyStyle } from "./body";
import iterateDOM from "./iterateDOM";
import { initTheme } from "./theme";

// tweak a site's style dynamically
export async function enableStyleChanges() {
    const domain = getDomainFrom(new URL(window.location.href));

    initTheme(domain);
    insertBackground();

    insertContentBlockStyle();

    // patch after new style applied
    modifyBodyStyle();

    insert(domain);
    // insertPageBrokenText();

    // this will remove all text side margin, so wait until pageview is likely enabled
    setTimeout(iterateDOM, 100);
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
