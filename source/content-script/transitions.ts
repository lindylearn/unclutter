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
import ElementPickerModifier from "./modifications/elementPicker";
import OverlayManager from "./modifications/overlay";
import {
    PageModifier,
    trackModifierExecution,
} from "./modifications/_interface";
import { preparePageviewAnimation } from "./pageview/enablePageView";

@trackModifierExecution
export default class TransitionManager implements PageModifier {
    private domain = getDomainFrom(new URL(window.location.href));

    private bodyStyleModifier = new BodyStyleModifier();
    private cssomProvider = new CSSOMProvider();
    private responsiveStyleModifier = new ResponsiveStyleModifier();
    private stylePatchesModifier = new StylePatchesModifier(this.cssomProvider);
    private annotationsModifier = new AnnotationsModifier();
    private textContainerModifier = new TextContainerModifier();
    private contentBlockModifier = new ContentBlockModifier(
        this.textContainerModifier
    );
    private backgroundModifier = new BackgroundModifier();
    private themeModifier = new ThemeModifier(
        this.cssomProvider,
        this.annotationsModifier,
        this.textContainerModifier,
        this.bodyStyleModifier
    );
    private elementPickerModifier = new ElementPickerModifier(this.domain);
    private overlayManager = new OverlayManager(
        this.domain,
        this.themeModifier,
        this.annotationsModifier,
        this.textContainerModifier,
        this.elementPickerModifier
    );

    private readingTimeModifier = new ReadingTimeModifier(this.overlayManager);

    async prepare() {
        // save original styles before changes
        this.bodyStyleModifier.prepare();

        // fetching CSS may take some time, so run other things in parallel
        await Promise.all([
            // handle CSS
            (async () => {
                // fetch CSS stylesheets if required
                await this.cssomProvider.prepare();
                // iterate CSS stylesheets
                await this.responsiveStyleModifier.prepare(this.cssomProvider);
            })(),
            // iterate DOM
            this.textContainerModifier.prepare(),
            // get active theme state
            this.themeModifier.prepare(this.domain),
        ]);

        // configure selectors
        this.contentBlockModifier.prepare();

        // can't set animation start properties in content.css, as that breaks some sites (e.g. xkcd.com)
        preparePageviewAnimation();
    }

    // visually fade out noisy elements
    fadeOutNoise() {
        // inserts new stylesheets which trigger ~50ms reflow
        this.contentBlockModifier.fadeOutNoise();
        this.responsiveStyleModifier.fadeOutNoise();
    }

    // prepare upcoming transition
    duringFadeOut() {
        // order is important -- should only trigger one reflow for background insert & text baseline styles

        // measure style properties for later
        this.textContainerModifier.measureFontProperties();

        // parse text background colors, insert background
        this.textContainerModifier.fadeOutNoise();
        this.backgroundModifier.fadeOutNoise();
        // set background dark if dark mode enabled, configure font size variable
        this.themeModifier.transitionIn();

        // keep text in same position but use animatable leftMargin everywhere
        // needs to be applied before transitionIn()
        this.textContainerModifier.prepareAnimation();

        // below steps where originally in transitionIn()

        // remove faded-out elements
        this.contentBlockModifier.transitionIn();
        this.responsiveStyleModifier.transitionIn();
    }

    // pageview width change was triggered just before calling this
    transitionIn() {
        // enable site mobile styles
        // this may shift layout in various ways
        this.responsiveStyleModifier.enableResponsiveStyles();

        // apply text container style
        this.textContainerModifier.afterTransitionIn();

        // adjust font size
        this.textContainerModifier.setTextFontOverride();

        // patch inline styles to overcome stubborn sites
        // modifies DOM & CSSOM
        this.bodyStyleModifier.transitionIn();

        // TODO move this elsewhere if takes too much performance?
        this.stylePatchesModifier.afterTransitionIn();

        // to look nice, all layout shifts should be done in this phase
    }

    async afterTransitionIn() {
        // insert iframe and wait until font loaded
        this.overlayManager.createIframes();
        await new Promise((r) => setTimeout(r, 50));

        // show UI
        // needs to be run before themeModifier to set correct auto theme value
        this.overlayManager.afterTransitionIn();

        // apply color theme - potentially expensive
        this.themeModifier.afterTransitionIn();
        await new Promise((r) => setTimeout(r, 0));

        // UI enhancements, can show up later
        this.annotationsModifier.afterTransitionIn(); // annotations fetch may take another 500ms
        this.readingTimeModifier.afterTransitionIn();

        // adjust background element height only after animations done
        this.backgroundModifier.observeHeightChanges();

        document.body.style.setProperty(
            "transition",
            "all 0.2s cubic-bezier(0.33, 1, 0.68, 1)",
            "important"
        );
    }

    async transitionOut() {
        // incoming animation set via pageview class, need inline styles for outgoing animation
        preparePageviewAnimation();
        // setup transition for changing text margin
        this.textContainerModifier.prepareTransitionOut();

        // remove UI
        this.annotationsModifier.transitionOut();
        this.overlayManager.transitionOut();

        // disable dark mode
        this.themeModifier.transitionOut();

        await new Promise((r) => setTimeout(r, 0));

        this.bodyStyleModifier.transitionOut();
        document.documentElement.classList.remove("pageview");

        this.textContainerModifier.transitionOut();

        // restore original layout
        this.responsiveStyleModifier.transitionOut();
        this.contentBlockModifier.transitionOut();
    }

    fadeinNoise() {
        this.textContainerModifier.afterTransitionOut();

        // restore noisy elements
        this.contentBlockModifier.fadeInNoise();
        this.responsiveStyleModifier.fadeInNoise();
    }

    afterTransitionOut() {
        this.cssomProvider.reenableOriginalStylesheets();

        // remove rest
        document
            .querySelectorAll(`.${overrideClassname}`)
            .forEach((e) => e.remove());

        // final cleanup, includes removing animation settings
        this.bodyStyleModifier.afterTransitionOut();
    }
}
