import { insertContentBlockStyle } from "../pageview/contentBlock";
import { insertPageSettings } from "../switch/insert";
import { insertBackground } from "./background";
import { modifyBodyStyle, unModifyBodyStyle } from "./body";
import { overrideClassname } from "./common";
import {
    fadeInNoise,
    iterateCSSOM,
    reenableOriginalStylesheets,
} from "./iterateCSSOM";
import iterateDOM, { unPatchDomTransform } from "./iterateDOM";
import { initTheme } from "./theme";

export async function enableStyleChanges() {}

export async function fadeOut(domain) {
    // do content block first as it shows changes immediately
    const [contentBlockFadeOut, contentBlockHide, contentBlockFadeIn] =
        insertContentBlockStyle();
    contentBlockFadeOut();

    const start = performance.now();
    const [hideNoise, enableResponsiveStyle, restoreOriginalStyle] =
        await iterateCSSOM();
    const duration = performance.now() - start;
    console.log(`Took ${Math.round(duration)}ms to iterate CSSOM`);
    hideNoise();

    const [fadeOutDom, patchDom] = iterateDOM();
    fadeOutDom();

    initTheme(domain);
    insertBackground();

    return [
        contentBlockHide,
        enableResponsiveStyle,
        patchDom,
        restoreOriginalStyle,
        contentBlockFadeIn,
    ];
}

export function pageViewTransition(
    domain,
    enableResponsiveStyle,
    contentBlockHide,
    patchDom
) {
    document.body.style.setProperty("transition", "all 0.2s");

    contentBlockHide();
    enableResponsiveStyle();
    patchDom(); // TODO how to make transition from original position

    modifyBodyStyle();

    setTimeout(() => {
        insertPageSettings(domain);
    }, 300);
}

export async function disableStyleChanges(
    restoreOriginalResponsiveStyle,
    contentBlockFadeIn
) {
    // revert CSSOM changes
    // restore original width

    restoreOriginalResponsiveStyle();
    unPatchDomTransform();

    document
        .querySelectorAll(
            ".content-block-hide, .content-block-custom-sites, .lindy-page-settings-topright, .lindy-page-settings-pageadjacent"
        )
        .forEach((e) => e.remove());

    document.documentElement.classList.remove("pageview");
    await new Promise((r) => setTimeout(r, 400));

    // fade-in
    // just hide overrides for now

    fadeInNoise();
    contentBlockFadeIn();

    // remove proxy stylesheets
    reenableOriginalStylesheets();

    // remove rest
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());

    // final cleanup, includes removing animation settings
    await new Promise((r) => setTimeout(r, 300));
    unModifyBodyStyle();
}
