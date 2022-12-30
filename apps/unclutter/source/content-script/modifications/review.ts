import browser from "../../common/polyfill";
import {
    injectReactIframe,
    removeReactIframe,
    sendIframeEvent,
    waitUntilIframeLoaded,
} from "../../common/reactIframe";
import BodyStyleModifier from "./bodyStyle";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class ReviewModifier implements PageModifier {
    private articleId: string;

    private iframe: HTMLIFrameElement;
    private loaded: boolean = false;
    private bodyStyleModifier: BodyStyleModifier;

    constructor(articleId: string, bodyStyleModifier: BodyStyleModifier) {
        this.articleId = articleId;
        this.bodyStyleModifier = bodyStyleModifier;
    }

    async afterTransitionIn() {
        this.bodyStyleModifier.setBottomContainerPadding();

        // always enable sidebar
        this.iframe = injectReactIframe("/review/index.html", "lindy-info-bottom", {
            articleId: this.articleId,
        });
        window.addEventListener("message", ({ data }) => {
            if (data.event === "bottomIframeLoaded") {
                // ready for css inject
                this.loaded = true;
            }
        });

        // set theme variables if those are already configured
        if (this.darkModeEnabled !== null) {
            this.setDarkMode(this.darkModeEnabled);
        }
        Object.entries(this.cssVariables).map(([key, value]) => this.setCssVariable(key, value));
    }

    async beforeTransitionOut() {
        if (this.iframe) {
            removeReactIframe("lindy-info-bottom");
        }
        this.loaded = false;
    }

    private cssVariables: { [key: string]: string } = {};
    async setCssVariable(key: string, value: string) {
        this.cssVariables[key] = value;

        if (!this.iframe) {
            return;
        }
        if (!this.loaded) {
            await waitUntilIframeLoaded(this.iframe);
        }

        // can't access iframe as from different origin, so send message instead
        sendIframeEvent(this.iframe, {
            event: "setCssVariable",
            key,
            value,
        });
    }

    private darkModeEnabled: boolean = null;
    async setDarkMode(darkModeEnabled: boolean) {
        this.darkModeEnabled = darkModeEnabled;

        if (!this.iframe) {
            return;
        }
        if (!this.loaded) {
            await waitUntilIframeLoaded(this.iframe);
        }

        sendIframeEvent(this.iframe, {
            event: "setDarkMode",
            darkModeEnabled,
        });
    }
}
