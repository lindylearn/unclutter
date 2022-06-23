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
    private responsiveStyleModifier = new ResponsiveStyleModifier(
        this.cssomProvider
    );
    private stylePatchesModifier = new StylePatchesModifier(this.cssomProvider);
    private annotationsModifier = new AnnotationsModifier();
    private textContainerModifier = new TextContainerModifier();
    private contentBlockModifier = new ContentBlockModifier(
        this.domain,
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
        // *** read DOM phase ***

        // save original styles before changes
        this.bodyStyleModifier.prepare();
        this.backgroundModifier.prepare();

        // iterate DOM in original state (& in read phase)
        this.textContainerModifier.iterateDom();
        this.textContainerModifier.measureFontProperties();

        // *** write DOM phase ***

        // proxying CSS may take some time, and will trigger reflow
        await Promise.all([
            // handle CSS
            (async () => {
                // fetch & re-insert CSS stylesheets if required
                await this.cssomProvider.prepare();
                // iterate CSSOM
                await this.responsiveStyleModifier.iterateCSSOM();
                await this.stylePatchesModifier.prepare();
            })(),
            // fetch settings
            this.themeModifier.prepare(this.domain),
            this.elementPickerModifier.prepare(),
        ]);

        this.textContainerModifier.assignClassnames();

        // configure selectors (does not interact with DOM)
        this.contentBlockModifier.prepare();

        preparePageviewAnimation();
    }

    // prepare upcoming transition
    prepareTransition() {
        // *** write DOM phase ***

        // set background colors, insert background
        this.textContainerModifier.fadeOutNoise();
        this.backgroundModifier.fadeOutNoise();
        // set background dark if dark mode enabled, configure font size variable
        this.themeModifier.transitionIn();

        // remove blocked elements
        this.responsiveStyleModifier.transitionIn();
        this.elementPickerModifier.transitionIn();
        this.contentBlockModifier.transitionIn();

        // apply text container styles (without moving position)
        this.textContainerModifier.applyContainerStyles();

        // set inline start position for text container position animation
        // must read DOM just after content block takes effect to animate y change
        requestAnimationFrame(() => {
            // *** read DOM phase ***
            this.textContainerModifier.prepareAnimation(); // triggers reflow

            // *** write DOM phase ***
        });
    }

    // pageview width change was triggered just before calling this
    transitionIn() {
        // *** write DOM phase ***

        // enable mobile styles & style patches (this may shift layout in various ways)
        // this.responsiveStyleModifier.enableResponsiveStyles();
        this.stylePatchesModifier.transitionIn();

        // adjust font size
        this.textContainerModifier.setTextFontOverride();

        // patch inline styles to overcome stubborn sites (modifies DOM & CSSOM)
        this.bodyStyleModifier.transitionIn();

        this.textContainerModifier.executeAnimation();
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
