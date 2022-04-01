import { overrideClassname } from "../common/stylesheets";
import BackgroundModifier from "./modifications/background";
import BodyStyleModifier from "./modifications/bodyStyle";
import ContentBlockModifier from "./modifications/contentBlock";
import ResponsiveStyleModifier from "./modifications/CSSOM/responsiveStyle";
import CSSOMProvider from "./modifications/CSSOM/_provider";
import TextContainerModifier from "./modifications/DOM/textContainer";
import OverlayManager from "./modifications/overlay";

export async function fadeOutNoise(
    domain: string,
    backgroundModifier: BackgroundModifier,
    contentBlockModifier: ContentBlockModifier,
    textContainerModifier: TextContainerModifier,
    responsiveStyleModifier: ResponsiveStyleModifier
) {
    // do content block first as it shows changes immediately
    await contentBlockModifier.fadeOutNoise();

    await responsiveStyleModifier.fadeOutNoise();
    await textContainerModifier.fadeOutNoise();

    await backgroundModifier.fadeOutNoise();
}

export async function transitionIn(
    domain,
    contentBlockModifier: ContentBlockModifier,
    bodyStyleModifier: BodyStyleModifier,
    textContainerModifier: TextContainerModifier,
    responsiveStyleModifier: ResponsiveStyleModifier,
    overlayManager: OverlayManager
) {
    document.body.style.setProperty("transition", "all 0.2s");

    await contentBlockModifier.transitionIn();

    await responsiveStyleModifier.transitionIn();
    await textContainerModifier.transitionIn(); // TODO how to make transition from original position

    await bodyStyleModifier.transitionIn();

    setTimeout(() => {
        overlayManager.transitionIn();
    }, 300);
}

export async function transitionOut(
    contentBlockModifier: ContentBlockModifier,
    bodyStyleModifier: BodyStyleModifier,
    textContainerModifier: TextContainerModifier,
    responsiveStyleModifier: ResponsiveStyleModifier,
    overlayManager: OverlayManager,
    cssomProvider: CSSOMProvider
) {
    await responsiveStyleModifier.transitionOut();
    await textContainerModifier.transitionOut();

    await contentBlockModifier.transitionOut();
    await overlayManager.transitionOut();

    document.documentElement.classList.remove("pageview");
    await new Promise((r) => setTimeout(r, 400));

    // fade-in
    // just hide overrides for now

    await responsiveStyleModifier.fadeInNoise();
    await contentBlockModifier.fadeInNoise();

    await cssomProvider.reenableOriginalStylesheets();

    // remove rest
    document
        .querySelectorAll(`.${overrideClassname}`)
        .forEach((e) => e.remove());

    // final cleanup, includes removing animation settings
    await new Promise((r) => setTimeout(r, 300));
    await bodyStyleModifier.transitionOut();
}
