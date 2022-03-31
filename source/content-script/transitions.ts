import { overrideClassname } from "../common/stylesheets";
import BackgroundModifier from "./modifications/background";
import BodyStyleModifier from "./modifications/bodyStyle";
import ContentBlockModifier from "./modifications/contentBlock";
import CSSOMModifier from "./modifications/CSSOM";
import DOMModifier from "./modifications/DOM";
import OverlayManager from "./modifications/overlay";

export async function fadeOutNoise(
    domain: string,
    backgroundModifier: BackgroundModifier,
    contentBlockModifier: ContentBlockModifier,
    domModifier: DOMModifier,
    cssomModifer: CSSOMModifier
) {
    // do content block first as it shows changes immediately
    await contentBlockModifier.fadeOutNoise();

    await cssomModifer.fadeOutNoise();
    await domModifier.fadeOutNoise();

    await backgroundModifier.fadeOutNoise();
}

export async function transitionIn(
    domain,
    contentBlockModifier: ContentBlockModifier,
    bodyStyleModifier: BodyStyleModifier,
    domModifier: DOMModifier,
    cssomModifer: CSSOMModifier,
    overlayManager: OverlayManager
) {
    document.body.style.setProperty("transition", "all 0.2s");

    await contentBlockModifier.transitionIn();

    await cssomModifer.transitionIn();
    await domModifier.transitionIn(); // TODO how to make transition from original position

    await bodyStyleModifier.transitionIn();

    setTimeout(() => {
        overlayManager.transitionIn();
    }, 300);
}

export async function transitionOut(
    contentBlockModifier: ContentBlockModifier,
    bodyStyleModifier: BodyStyleModifier,
    domModifier: DOMModifier,
    cssomModifer: CSSOMModifier,
    overlayManager: OverlayManager
) {
    await cssomModifer.transitionOut();
    await domModifier.transitionOut();

    await contentBlockModifier.transitionOut();
    await overlayManager.transitionOut();

    document.documentElement.classList.remove("pageview");
    await new Promise((r) => setTimeout(r, 400));

    // fade-in
    // just hide overrides for now

    await cssomModifer.fadeInNoise();
    await contentBlockModifier.fadeInNoise();

    // remove proxy stylesheets
    await cssomModifer.reenableOriginalStylesheets();

    // remove rest
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());

    // final cleanup, includes removing animation settings
    await new Promise((r) => setTimeout(r, 300));
    await bodyStyleModifier.transitionOut();
}
