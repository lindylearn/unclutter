import browser from "../../common/polyfill";
import { LibraryState } from "../../common/schema";
import { createIframeNode } from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";

import { waitUntilIframeLoaded } from "../../common/reactIframe";
import BodyStyleModifier from "./bodyStyle";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { setFeatureFlag, submittedFeedbackFlag } from "../../common/featureFlags";

@trackModifierExecution
export default class LibraryModalModifier implements PageModifier {
    private bodyStyleModifier: BodyStyleModifier;

    constructor(bodyStyleModifier: BodyStyleModifier) {
        this.bodyStyleModifier = bodyStyleModifier;

        // set up event handlers once
        window.addEventListener("message", ({ data }) => {
            if (data.event === "modalIframeLoaded") {
                // ready for css inject
                this.iframeLoaded = true;
            } else if (data.event === "modalAppReady") {
                // react app loaded, can now handle events
                this.appLoaded = true;
            } else if (data.event === "destroyLibraryModal") {
                this.destroyIframe();
            } else if (data.event === "onSubmitFeedback") {
                setFeatureFlag(submittedFeedbackFlag, true);
            } else if (data.event === "showModal") {
                this.showModal(data.initialTab, data.isFeedbackModal);
            }
        });
    }

    private modalIframe: HTMLIFrameElement;
    private iframeLoaded: boolean = false;
    private appLoaded: boolean = false;
    async showModal(initialTab?: string, isFeedbackModal?: boolean) {
        // create iframe on demand
        this.createIframe(initialTab, isFeedbackModal);

        // set theme variables once html ready, before react rendered
        await waitUntilIframeLoaded(this.modalIframe);
        if (this.darkModeEnabled !== null) {
            this.setDarkMode(this.darkModeEnabled);
        }
        Object.entries(this.cssVariables).map(([key, value]) => this.setCssVariable(key, value));
        // set initial library state
        this.sendModalEvent({
            event: "setLibraryState",
            libraryState: this.libraryState,
        });

        this.bodyStyleModifier.enableScrollLock();
    }

    private createIframe(initialTab?: string, isFeedbackModal?: boolean) {
        const iframeUrl = new URL(browser.runtime.getURL("/modal/index.html"));
        iframeUrl.searchParams.append("articleUrl", window.location.href);
        iframeUrl.searchParams.append(
            "darkModeEnabled",
            (this.darkModeEnabled || false).toString()
        );
        iframeUrl.searchParams.append("isFeedbackModal", (isFeedbackModal || false).toString());
        if (initialTab) {
            iframeUrl.searchParams.append("initialTab", initialTab);
        }

        this.modalIframe = createIframeNode("lindy-library-modal");
        this.modalIframe.src = iframeUrl.toString();
        this.modalIframe.style.setProperty("position", "fixed", "important"); // put on new layer
        document.documentElement.appendChild(this.modalIframe);

        if (isFeedbackModal) {
        } else {
            reportEventContentScript("openLibraryModal", {
                initialTab,
                onPaidPlan: this.libraryState.userInfo?.onPaidPlan,
                trialEnabled: this.libraryState.userInfo?.trialEnabled,
                linkCount: this.libraryState.linkCount,
                articleCount: this.libraryState.readingProgress.articleCount,
                completedCount: this.libraryState.readingProgress.completedCount,
                annotationCount: this.libraryState.readingProgress.annotationCount,
            });
        }
    }

    private destroyIframe() {
        if (!this.modalIframe) {
            return;
        }

        // immediately disable scroll lock to focus annotations
        this.bodyStyleModifier.disableScrollLock();

        // delay iframe removal to play out animation first
        setTimeout(() => {
            this.modalIframe.remove();
            this.modalIframe = null;

            this.iframeLoaded = false;
            this.appLoaded = false;
        }, 300);
    }

    private sendModalEvent(event: object) {
        if (this.modalIframe) {
            this.modalIframe.contentWindow?.postMessage(event, "*");
        }
    }

    private cssVariables: { [key: string]: string } = {};
    async setCssVariable(key: string, value: string) {
        this.cssVariables[key] = value;

        if (!this.modalIframe) {
            return;
        }
        if (!this.iframeLoaded) {
            await waitUntilIframeLoaded(this.modalIframe);
        }

        // can't access iframe as from different origin, so send message instead
        this.sendModalEvent({
            event: "setCssVariable",
            key,
            value,
        });
    }

    private darkModeEnabled: boolean = null;
    async setDarkMode(darkModeEnabled: boolean) {
        this.darkModeEnabled = darkModeEnabled;

        if (!this.modalIframe) {
            return;
        }
        if (!this.iframeLoaded) {
            await waitUntilIframeLoaded(this.modalIframe);
        }

        this.sendModalEvent({
            event: "setDarkMode",
            darkModeEnabled,
        });
    }

    closeModal() {
        // send event to modal to gracefully close, will then send this event back
        this.sendModalEvent({
            event: "closeLibraryModal",
        });
    }

    toggleModal() {
        if (this.modalIframe) {
            this.closeModal();
        } else {
            this.showModal();
        }
    }

    private libraryState: LibraryState = null;
    updateLibraryState(libraryState: LibraryState) {
        this.libraryState = libraryState;

        this.sendModalEvent({
            event: "setLibraryState",
            libraryState: this.libraryState,
        });
    }
}
