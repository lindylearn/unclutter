import { overrideClassname } from "../common/stylesheets";
import { getDomainFrom } from "../common/util";
import AnnotationsModifier from "./modifications/annotations/annotationsModifier";
import BackgroundModifier from "./modifications/background";
import BodyStyleModifier from "./modifications/bodyStyle";
import ContentBlockModifier from "./modifications/contentBlock";
import ResponsiveStyleModifier from "./modifications/CSSOM/responsiveStyle";
import StylePatchesModifier from "./modifications/CSSOM/stylePatches";
import ThemeModifier from "./modifications/CSSOM/theme";
import CSSOMProvider from "./modifications/CSSOM/_provider";
import ReadingTimeModifier from "./modifications/DOM/readingTime";
import TextContainerModifier from "./modifications/DOM/textContainer";
import OverlayManager from "./modifications/overlay";
import {
    PageModifier,
    trackModifierExecution,
} from "./modifications/_interface";

@trackModifierExecution
export default class TransitionManager implements PageModifier {
    private domain = getDomainFrom(new URL(window.location.href));

    private cssomProvider = new CSSOMProvider();

    private backgroundModifier = new BackgroundModifier();
    private contentBlockModifier = new ContentBlockModifier();
    private bodyStyleModifier = new BodyStyleModifier();
    private responsiveStyleModifier = new ResponsiveStyleModifier();
    private stylePatchesModifier = new StylePatchesModifier(this.cssomProvider);
    private annotationsModifier = new AnnotationsModifier();
    private themeModifier = new ThemeModifier(
        this.cssomProvider,
        this.annotationsModifier
    );
    private overlayManager = new OverlayManager(
        this.domain,
        this.themeModifier,
        this.annotationsModifier
    );
    private textContainerModifier = new TextContainerModifier(
        this.themeModifier
    );
    private readingTimeModifier = new ReadingTimeModifier(this.overlayManager);

    async prepare() {
        await this.cssomProvider.prepare();
        await this.responsiveStyleModifier.prepare(this.cssomProvider);
        await this.textContainerModifier.prepare();
        await this.themeModifier.prepare(this.domain);
    }

    fadeOutNoise() {
        // do content block first as it shows changes immediately
        this.contentBlockModifier.fadeOutNoise();

        this.responsiveStyleModifier.fadeOutNoise();
        this.textContainerModifier.fadeOutNoise();

        this.backgroundModifier.fadeOutNoise();
    }

    transitionIn() {
        this.themeModifier.transitionIn();
        this.contentBlockModifier.transitionIn();
        this.responsiveStyleModifier.transitionIn();

        this.bodyStyleModifier.transitionIn();
        this.textContainerModifier.transitionIn();
        // running this in transitionIn() breaks the animation, but not running it often results in text glitches
        this.textContainerModifier.afterTransitionIn();
    }

    async afterTransitionIn() {
        // ui needs to be inserted before themeModifier to set correct auto theme value
        await this.overlayManager.afterTransitionIn();
        this.annotationsModifier.afterTransitionIn();

        await this.themeModifier.afterTransitionIn();
        await this.stylePatchesModifier.afterTransitionIn();
        await this.readingTimeModifier.afterTransitionIn();
    }

    async transitionOut() {
        await this.annotationsModifier.transitionOut();

        await this.responsiveStyleModifier.transitionOut();
        await this.textContainerModifier.transitionOut();

        await this.contentBlockModifier.transitionOut();
        await this.overlayManager.transitionOut();
        await this.themeModifier.transitionOut();

        document.documentElement.classList.remove("pageview");
    }

    async fadeinNoise() {
        await this.responsiveStyleModifier.fadeInNoise();
        await this.contentBlockModifier.fadeInNoise();

        await this.cssomProvider.reenableOriginalStylesheets();
    }

    async afterTransitionOut() {
        await this.overlayManager.afterTransitionOut();

        // remove rest
        document
            .querySelectorAll(`.${overrideClassname}`)
            .forEach((e) => e.remove());

        // final cleanup, includes removing animation settings
        await this.bodyStyleModifier.afterTransitionOut();
    }
}
