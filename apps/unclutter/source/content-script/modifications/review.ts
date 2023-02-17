import {
    getRemoteFeatureFlag,
    getUserInfoSimple,
} from "@unclutter/library-components/dist/common/messaging";
import { showLibrarySignupFlag } from "../../common/featureFlags";
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
    private bodyStyleModifier: BodyStyleModifier;

    constructor(articleId: string, bodyStyleModifier: BodyStyleModifier) {
        this.articleId = articleId;
        this.bodyStyleModifier = bodyStyleModifier;

        window.addEventListener("message", (event) => this.onMessage(event.data || {}));
    }

    private relatedCount?: number;
    private onMessage(message: any) {
        if (message.event === "updateRelatedCount") {
            this.relatedCount = message.relatedCount;

            if (this.appLoaded) {
                sendIframeEvent(this.iframe, {
                    event: "updateRelatedCount",
                    relatedCount: this.relatedCount,
                });
            } else {
                // deliver once loaded below
            }
        }
    }

    private iframeLoaded: boolean = false;
    private appLoaded: boolean = false;
    async afterTransitionIn() {
        const userInfo = await getUserInfoSimple();

        let type: string;
        if (userInfo?.aiEnabled) {
            type = "review";
        } else {
            const showSignup = await getRemoteFeatureFlag(showLibrarySignupFlag);
            if (!showSignup) {
                return;
            }
            type = "signup";
        }

        // always enable sidebar
        this.iframe = injectReactIframe("/review/index.html", "lindy-info-bottom", {
            articleId: this.articleId,
            darkModeEnabled: (this.darkModeEnabled || false).toString(),
            type,
        });

        window.addEventListener("message", ({ data }) => {
            if (data.event === "bottomIframeLoaded") {
                // ready for css inject
                this.iframeLoaded = true;
            } else if (data.event === "bottomAppReady") {
                // react loaded
                this.appLoaded = true;

                if (this.relatedCount !== undefined) {
                    sendIframeEvent(this.iframe, {
                        event: "updateRelatedCount",
                        relatedCount: this.relatedCount,
                    });
                }
            } else if (data.event === "bottomIframeSetHeight") {
                this.iframe.style.setProperty("height", data.height, "important");
                this.bodyStyleModifier.setBottomContainerPadding(data.height);
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
        this.iframeLoaded = false;
    }

    private cssVariables: { [key: string]: string } = {};
    async setCssVariable(key: string, value: string) {
        this.cssVariables[key] = value;

        if (!this.iframe) {
            return;
        }
        if (!this.iframeLoaded) {
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
        if (!this.iframeLoaded) {
            await waitUntilIframeLoaded(this.iframe);
        }

        sendIframeEvent(this.iframe, {
            event: "setDarkMode",
            darkModeEnabled,
        });
    }
}
