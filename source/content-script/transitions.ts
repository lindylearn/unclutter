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
import { preparePageviewAnimation } from "./pageview/enablePageView";

@trackModifierExecution
export default class TransitionManager implements PageModifier {
    private domain = getDomainFrom(new URL(window.location.href));

    private cssomProvider = new CSSOMProvider();

    private contentBlockModifier = new ContentBlockModifier();
    private bodyStyleModifier = new BodyStyleModifier();
    private responsiveStyleModifier = new ResponsiveStyleModifier();
    private stylePatchesModifier = new StylePatchesModifier(this.cssomProvider);
    private annotationsModifier = new AnnotationsModifier();
    private textContainerModifier = new TextContainerModifier();
    private backgroundModifier = new BackgroundModifier(
        this.textContainerModifier
    );
    private themeModifier = new ThemeModifier(
        this.cssomProvider,
        this.annotationsModifier,
        this.textContainerModifier
    );
    private overlayManager = new OverlayManager(
        this.domain,
        this.themeModifier,
        this.annotationsModifier
    );

    private readingTimeModifier = new ReadingTimeModifier(this.overlayManager);

    async prepare() {
        preparePageviewAnimation();

        await this.cssomProvider.prepare();
        await this.responsiveStyleModifier.prepare(this.cssomProvider);
        await this.textContainerModifier.prepare();
        await this.themeModifier.prepare(this.domain);
    }

    fadeOutNoise() {
        // shows custom site changes immediately
        this.contentBlockModifier.fadeOutNoise();

        // fade noisy elements to white
        this.responsiveStyleModifier.fadeOutNoise();
        this.textContainerModifier.fadeOutNoise();

        // insert modifiable body background element
        this.backgroundModifier.fadeOutNoise();
    }

    transitionIn() {
        // check if enable dark mode
        this.themeModifier.transitionIn();

        // block faded-out elements (this shifts layout)
        this.contentBlockModifier.transitionIn();
        this.responsiveStyleModifier.transitionIn();

        // adjust font size
        this.textContainerModifier.transitionIn();
    }

    async afterTransitionIn() {
        // running this in transitionIn() breaks the animation, but not running it often results in text glitches
        this.textContainerModifier.afterTransitionIn(); // adjust text containers

        // show UI
        // needs to be run before themeModifier to set correct auto theme value
        await this.overlayManager.afterTransitionIn();

        // apply color theme - potentially expensive
        await this.themeModifier.afterTransitionIn();

        // patch inline styles to overcome stubborn sites
        // this immediately applies the pageview style
        this.bodyStyleModifier.transitionIn();
        await this.stylePatchesModifier.afterTransitionIn();

        // UI enhancements, can show up later
        this.annotationsModifier.afterTransitionIn(); // annotations fetch may take another 500ms
        this.readingTimeModifier.afterTransitionIn();
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
