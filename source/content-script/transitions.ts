import { getDomainFrom } from "source/common/util";
import { overrideClassname } from "../common/stylesheets";
import BackgroundModifier from "./modifications/background";
import BodyStyleModifier from "./modifications/bodyStyle";
import ContentBlockModifier from "./modifications/contentBlock";
import ResponsiveStyleModifier from "./modifications/CSSOM/responsiveStyle";
import StylePatchesModifier from "./modifications/CSSOM/stylePatches";
import ThemeModifier from "./modifications/CSSOM/theme";
import CSSOMProvider from "./modifications/CSSOM/_provider";
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
    private textContainerModifier = new TextContainerModifier();
    private responsiveStyleModifier = new ResponsiveStyleModifier();
    private stylePatchesModifier = new StylePatchesModifier(this.cssomProvider);
    private themeModifier = new ThemeModifier(this.cssomProvider);
    private overlayManager = new OverlayManager(
        this.domain,
        this.themeModifier
    );

    async prepare() {
        await this.cssomProvider.prepare();
        await this.responsiveStyleModifier.prepare(this.cssomProvider);
        await this.textContainerModifier.prepare();
        await this.themeModifier.prepare(this.domain);
    }

    async fadeOutNoise() {
        // do content block first as it shows changes immediately
        await this.contentBlockModifier.fadeOutNoise();

        await this.responsiveStyleModifier.fadeOutNoise();
        await this.textContainerModifier.fadeOutNoise();

        await this.backgroundModifier.fadeOutNoise();
    }

    async transitionIn() {
        document.body.style.setProperty("transition", "all 0.2s");

        await this.contentBlockModifier.transitionIn();

        await this.responsiveStyleModifier.transitionIn();
        await this.textContainerModifier.transitionIn(); // TODO how to make transition from original position

        await this.bodyStyleModifier.transitionIn();

        setTimeout(() => {
            this.overlayManager.transitionIn();
        }, 300);
    }

    async afterTransitionIn() {
        await this.themeModifier.afterTransitionIn();
        await this.stylePatchesModifier.afterTransitionIn();
    }

    async transitionOut() {
        await this.responsiveStyleModifier.transitionOut();
        await this.textContainerModifier.transitionOut();

        await this.contentBlockModifier.transitionOut();
        await this.overlayManager.transitionOut();

        document.documentElement.classList.remove("pageview");
        await new Promise((r) => setTimeout(r, 400));

        // fade-in
        // just hide overrides for now

        await this.responsiveStyleModifier.fadeInNoise();
        await this.contentBlockModifier.fadeInNoise();

        await this.cssomProvider.reenableOriginalStylesheets();

        // remove rest
        document
            .querySelectorAll(`.${overrideClassname}`)
            .forEach((e) => e.remove());

        // final cleanup, includes removing animation settings
        await new Promise((r) => setTimeout(r, 300));
        await this.bodyStyleModifier.transitionOut();
    }
}
