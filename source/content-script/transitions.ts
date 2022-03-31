import { overrideClassname } from "../common/stylesheets";
import { initTheme } from "../common/theme";
import BackgroundModifier from "./modifications/background";
import BodyStyleModifier from "./modifications/bodyStyle";
import ContentBlockModifier from "./modifications/contentBlock";
import DOMModifier from "./modifications/DOM";
import {
    fadeInNoise,
    iterateCSSOM,
    reenableOriginalStylesheets,
} from "./modifications/iterateCSSOM";
import { insertPageSettings } from "./switch/insert";

export async function fadeOutNoise(
    domain: string,
    backgroundModifier: BackgroundModifier,
    contentBlockModifier: ContentBlockModifier,
    domModifier: DOMModifier
) {
    // do content block first as it shows changes immediately
    await contentBlockModifier.fadeOutNoise();

    const themeName = await initTheme(domain);

    const [hideNoise, enableResponsiveStyle, restoreOriginalStyle] =
        await iterateCSSOM(themeName);
    hideNoise();

    await domModifier.fadeOutNoise();

    await backgroundModifier.fadeOutNoise();

    return [enableResponsiveStyle, restoreOriginalStyle];
}

export async function transitionIn(
    domain,
    enableResponsiveStyle,
    contentBlockModifier: ContentBlockModifier,
    bodyStyleModifier: BodyStyleModifier,
    domModifier: DOMModifier
) {
    document.body.style.setProperty("transition", "all 0.2s");

    await contentBlockModifier.transitionIn();
    enableResponsiveStyle();
    await domModifier.transitionIn(); // TODO how to make transition from original position

    await bodyStyleModifier.transitionIn();

    setTimeout(() => {
        insertPageSettings(domain);
    }, 300);
}

export async function transitionOut(
    restoreOriginalResponsiveStyle,
    contentBlockModifier: ContentBlockModifier,
    bodyStyleModifier: BodyStyleModifier,
    domModifier: DOMModifier
) {
    // revert CSSOM changes
    // restore original width

    restoreOriginalResponsiveStyle();
    await domModifier.transitionOut();

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
    await bodyStyleModifier.transitionOut();
}
