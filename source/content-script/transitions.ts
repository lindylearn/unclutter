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
    private themeModifier = new ThemeModifier(
        this.cssomProvider,
        this.annotationsModifier,
        this.textContainerModifier,
        this.bodyStyleModifier
    );
    private backgroundModifier = new BackgroundModifier(this.themeModifier);
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
    }

    // prepare upcoming transition
    prepareTransition() {
        // *** write DOM phase ***

        // set background dark if dark mode enabled, configure font size variable
        this.textContainerModifier.processBackgroundColors();
        this.themeModifier.setThemeVariables();

        // create background element, prepare animation based on theme pagewidth
        this.backgroundModifier.insertBackground();

        // remove blocked elements
        this.responsiveStyleModifier.transitionIn();
        this.elementPickerModifier.transitionIn();
        this.contentBlockModifier.transitionIn();

        // enable mobile styles & style patches (this may shift layout in various ways)
        this.responsiveStyleModifier.enableResponsiveStyles();
        this.stylePatchesModifier.transitionIn();

        // apply text container styles (without moving position)
        this.textContainerModifier.applyContainerStyles();
        // adjust font size
        this.textContainerModifier.setTextFontOverride();

        // patch inline styles to overcome stubborn sites (modifies DOM & CSSOM)
        this.bodyStyleModifier.transitionIn();
    }

    // set inline start position for text container position animation
    // must read DOM just after content block takes effect to animate y change
    prepareAnimation() {
        // *** read DOM phase ***
        // *** write DOM phase ***

        this.textContainerModifier.prepareAnimation();
        this.backgroundModifier.animateWidthReduction();
    }

    executeAnimation() {
        // *** read DOM phase ***
        // *** write DOM phase ***

        this.textContainerModifier.executeAnimation();
    }

    async afterTransitionIn() {
        // *** read DOM phase ***
        // read DOM after content block
        this.readingTimeModifier.afterTransitionIn();
        this.annotationsModifier.readPageHeight();

        // *** write DOM phase ***
        // insert iframes & render UI
        this.overlayManager.createIframes();
        this.overlayManager.renderUi();

        await new Promise((r) => setTimeout(r, 300));
        // *** read DOM phase ***
        // *** write DOM phase ***

        // apply color theme - iterating CSSOM and re-rendering page is potentially expensive
        this.themeModifier.afterTransitionIn();

        // adjust background element height only after animations done
        this.backgroundModifier.observeHeightChanges();
        this.bodyStyleModifier.afterTransitionIn();

        // insert annotations sidebar, start fetch
        this.annotationsModifier.afterTransitionIn();
    }

    async transitionOut() {
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
