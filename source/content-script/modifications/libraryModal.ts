import browser from "../../common/polyfill";
import { LibraryState } from "../../common/schema";
import { createIframeNode, insertIframeFont } from "./overlay";
import { PageModifier, trackModifierExecution } from "./_interface";

import { waitUntilIframeLoaded } from "./annotations/injectSidebar";

@trackModifierExecution
export default class LibraryModalModifier implements PageModifier {
    constructor() {}

    private modalIframe: HTMLIFrameElement;
    private iframeLoaded: boolean = false;
    private appLoaded: boolean = false;
    async showModal() {
        // create iframe on demand
        this.createIframe();
        window.addEventListener("message", ({ data }) => {
            if (data.event === "modalIframeLoaded") {
                // ready for css inject
                this.iframeLoaded = true;
            } else if (data.event === "modalAppReady") {
                // react app loaded, can now handle events
                this.appLoaded = true;
            } else if (data.event === "closeLibraryModal") {
                this.closeModal();
            }
        });

        // set theme variables once html ready, before react rendered
        await waitUntilIframeLoaded(this.modalIframe);
        if (this.darkModeEnabled !== null) {
            this.setDarkMode(this.darkModeEnabled);
        }
        Object.entries(this.cssVariables).map(([key, value]) =>
            this.setCssVariable(key, value)
        );
        // set initial library state
        this.sendModalEvent({
            event: "setLibraryState",
            libraryState: this.libraryState,
        });
    }

    private createIframe() {
        const iframeUrl = new URL(browser.runtime.getURL("/modal/index.html"));
        iframeUrl.searchParams.append(
            "darkModeEnabled",
            (this.darkModeEnabled || false).toString()
        );

        this.modalIframe = createIframeNode("lindy-library-modal");
        this.modalIframe.src = iframeUrl.toString();
        this.modalIframe.style.position = "fixed"; // put on new layer
        document.documentElement.appendChild(this.modalIframe);
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
        this.modalIframe?.remove();
        this.modalIframe = null;

        this.iframeLoaded = false;
        this.appLoaded = false;
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
