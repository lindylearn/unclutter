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
import LinkAnnotationsModifier from "./modifications/DOM/linksAnnotations";
import ReadingTimeModifier from "./modifications/DOM/readingTime";
import TextContainerModifier from "./modifications/DOM/textContainer";
import ElementPickerModifier from "./modifications/elementPicker";
import LibraryModifier from "./modifications/library";
import OverlayManager from "./modifications/overlay";
import {
    PageModifier,
    trackModifierExecution,
} from "./modifications/_interface";

@trackModifierExecution
export default class TransitionManager implements PageModifier {
    private url = window.location.href;
    private domain = getDomainFrom(new URL(this.url));

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
    private libraryModifier = new LibraryModifier(
        this.url,
        this.overlayManager
    );
    private linkAnnotationsModifier = new LinkAnnotationsModifier(
        this.annotationsModifier,
        this.libraryModifier
    );
    private readingTimeModifier = new ReadingTimeModifier(
        this.overlayManager,
        this.libraryModifier
    );

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

        // state library network fetch
        this.libraryModifier.fetchState();
    }

    // prepare upcoming transition
    transitionIn() {
        // *** write DOM phase ***

        // set background dark if dark mode enabled, configure font size variable
        this.textContainerModifier.processBackgroundColors();
        this.themeModifier.setThemeVariables();

        // create background element, prepare animation based on theme pagewidth
        this.backgroundModifier.insertBackground();

        // remove blocked elements if markup as expected
        if (this.textContainerModifier.foundMainContentElement) {
            this.responsiveStyleModifier.blockFixedElements();
            this.textContainerModifier.enableSiblingBlock();
        }
        this.contentBlockModifier.transitionIn(); // uses softer blocking if no text elements found
        this.elementPickerModifier.transitionIn();

        // enable mobile styles & style patches (this may shift layout in various ways)
        this.responsiveStyleModifier.enableResponsiveStyles();
        this.stylePatchesModifier.transitionIn();

        // apply text container styles (without moving position)
        this.textContainerModifier.applyContainerStyles();
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
        this.overlayManager.parseOutline();
        this.backgroundModifier.observeHeightChanges();

        // *** write DOM phase ***
        // insert iframes & render UI
        this.overlayManager.createIframes();
        this.overlayManager.renderUi();

        // wait until ui fade-in done
        await new Promise((r) => setTimeout(r, 300));

        // *** read DOM phase ***
        // *** write DOM phase ***

        // apply color theme - iterating CSSOM and re-rendering page is potentially expensive
        this.bodyStyleModifier.afterTransitionIn();
        const enabledDarkMode = this.themeModifier.applyActiveColorTheme();

        if (enabledDarkMode) {
            // wait until dark mode enabled (perf seems fine, but sidebar immediately shows dark background)
            await new Promise((r) => setTimeout(r, 400));
        }

        // insert annotations sidebar, start fetch
        this.linkAnnotationsModifier.parseArticle(); // reads page, wraps link elems
        this.annotationsModifier.afterTransitionIn();

        this.overlayManager.insertUiFont(); // causes ~50ms layout reflow

        this.libraryModifier.startReadingProgressSync();
        this.libraryModifier.scrollToLastReadingPosition();

        // insert UI at bottom of article later
        await new Promise((r) => setTimeout(r, 1000));
        this.overlayManager.renderBottomContainer();
    }

    beforeTransitionOut() {
        // remove ui enhancements
        this.readingTimeModifier.beforeTransitionOut();
        this.annotationsModifier.beforeTransitionOut();

        // fade-out ui
        this.overlayManager.fadeOutUi();

        // disable dark mode
        this.themeModifier.transitionOut();

        // undo hardcoded styles
        this.backgroundModifier.unObserveHeightChanges();
        this.bodyStyleModifier.beforeTransitionOut();

        // ideally perform all style undos here to make transition look nicer

        // restore original style
        this.responsiveStyleModifier.disableResponsiveStyles();
        this.stylePatchesModifier.transitionOut();
        this.textContainerModifier.removeOverrideStyles();
    }

    executeReverseAnimation() {
        this.textContainerModifier.executeReverseAnimation();
        this.backgroundModifier.animateReverseWidthReduction();
    }

    transitionOut() {
        // remove faded-out UI components
        this.overlayManager.removeUi();

        // disable text container styles
        this.textContainerModifier.removeContainerStyles();
        this.bodyStyleModifier.transitionOut();

        // undo element block and start fade-in
        this.contentBlockModifier.fadeInNoise();
        this.textContainerModifier.fadeInSiblings();

        // content block without fade-in for now
        this.elementPickerModifier.transitionOut();
        this.responsiveStyleModifier.unblockFixedElements();
    }

    afterTransitionOut() {
        this.backgroundModifier.removeBackground();
        this.contentBlockModifier.transitionOut();

        // remove rest
        document
            .querySelectorAll(
                // keep proxied stylesheets active for faster re-enable
                `.${overrideClassname}:not(.lindy-stylesheet-proxy)`
            )
            .forEach((e) => e.remove());
    }
}
