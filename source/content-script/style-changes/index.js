import { insertContentBlockStyle } from "../pageview/contentBlock";
import { unPatchStylesheets } from "../pageview/patchStylesheets";
import { insertBackground, overrideClassname } from "./background";
import { unModifyBodyStyle } from "./body";
import { iterateCSSOM } from "./iterateCSSOM";
import iterateDOM from "./iterateDOM";
import { initTheme } from "./theme";

export async function enableStyleChanges() {}

export async function fadeOut(domain) {
    // do content block first as it shows changes immediately
    const [contentBlockFadeOut, contentBlockHide] = insertContentBlockStyle();
    contentBlockFadeOut();

    const start = performance.now();
    const [hideNoise, enableResponsiveStyle] = await iterateCSSOM();
    const duration = performance.now() - start;
    console.log(`Took ${Math.round(duration)}ms to iterate CSSOM`);
    hideNoise();

    const [fadeOutDom, patchDom] = iterateDOM();
    fadeOutDom();

    initTheme(domain);
    insertBackground();

    return [contentBlockHide, enableResponsiveStyle, patchDom];
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
