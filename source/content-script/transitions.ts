import { overrideClassname } from "../common/stylesheets";
import BackgroundModifier from "./modifications/background";
import { modifyBodyStyle, unModifyBodyStyle } from "./modifications/body";
import ContentBlockModifier from "./modifications/contentBlock";
import {
    fadeInNoise,
    iterateCSSOM,
    reenableOriginalStylesheets,
} from "./modifications/iterateCSSOM";
import iterateDOM, { unPatchDomTransform } from "./modifications/iterateDOM";
import { initTheme } from "./modifications/theme";
import { insertPageSettings } from "./switch/insert";

export async function fadeOutNoise(
    domain: string,
    backgroundModifier: BackgroundModifier,
    contentBlockModifier: ContentBlockModifier
) {
    // do content block first as it shows changes immediately
    await contentBlockModifier.fadeOutNoise();

    const themeName = await initTheme(domain);

    let start = performance.now();
    const [hideNoise, enableResponsiveStyle, restoreOriginalStyle] =
        await iterateCSSOM(themeName);
    let duration = performance.now() - start;
    console.log(`Took ${Math.round(duration)}ms to iterate CSSOM`);
    hideNoise();

    start = performance.now();
    const [fadeOutDom, patchDom] = iterateDOM();
    duration = performance.now() - start;
    console.log(`Took ${Math.round(duration)}ms to iterate DOM`);
    fadeOutDom();

    await backgroundModifier.fadeOutNoise();

    return [enableResponsiveStyle, patchDom, restoreOriginalStyle];
}

export async function transitionIn(
    domain,
    enableResponsiveStyle,
    patchDom,
    contentBlockModifier: ContentBlockModifier
) {
    document.body.style.setProperty("transition", "all 0.2s");

    await contentBlockModifier.transitionIn();
    enableResponsiveStyle();
    patchDom(); // TODO how to make transition from original position

    modifyBodyStyle();

    setTimeout(() => {
        insertPageSettings(domain);
    }, 300);
}

export async function transitionOut(
    restoreOriginalResponsiveStyle,
    contentBlockModifier: ContentBlockModifier
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
    await contentBlockModifier.fadeInNoise();

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
