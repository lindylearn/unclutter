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
        // fade noisy elements to white
        // shows some custom site changes immediately
        this.contentBlockModifier.fadeOutNoise();
        this.responsiveStyleModifier.fadeOutNoise();

        // parse text background colors and insert durable body background
        this.textContainerModifier.fadeOutNoise();
        this.backgroundModifier.fadeOutNoise();

        // prepare upcoming transition:
        // set background dark if dark mode enabled, configure font size variable
        this.themeModifier.transitionIn();
    }

    // pageview width change is triggered just before calling this
    transitionIn() {
        // remove faded-out elements
        this.contentBlockModifier.transitionIn();
        this.responsiveStyleModifier.transitionIn();

        // enable site mobile styles
        // this shifts layout and is often not animation-friendly
        this.responsiveStyleModifier.enableResponsiveStyles();

        // adjust font size
        this.textContainerModifier.transitionIn();

        // adjust text containers
        this.textContainerModifier.afterTransitionIn();

        // patch inline styles to overcome stubborn sites
        // this immediately applies the pageview style
        this.bodyStyleModifier.transitionIn();
        this.stylePatchesModifier.afterTransitionIn();
    }

    async afterTransitionIn() {
        // show UI
        // needs to be run before themeModifier to set correct auto theme value
        await this.overlayManager.afterTransitionIn();

        // apply color theme - potentially expensive
        await this.themeModifier.afterTransitionIn();

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
