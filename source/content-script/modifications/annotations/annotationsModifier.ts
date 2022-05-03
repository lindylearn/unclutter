import { PageModifier, trackModifierExecution } from "../_interface";
import {
    createAnnotationListener,
    removeAnnotationListener,
    sendSidebarEvent,
} from "./annotationsListener";
import {
    injectSidebar,
    removeSidebar,
    waitUntilIframeLoaded,
} from "./injectSidebar";
import {
    createSelectionListener,
    removeSelectionListener,
} from "./selectionListener";

@trackModifierExecution
export default class AnnotationsModifier implements PageModifier {
    private sidebarIframe: HTMLIFrameElement;
    private sidebarLoaded: boolean = false;

    afterTransitionIn() {
        this.sidebarIframe = injectSidebar();
        window.addEventListener("message", ({ data }) => {
            if (data.event === "sidebarIframeLoaded") {
                this.sidebarLoaded = true;
            }
        });

        // listeners need to be configured before rendering iframe to anchor annotations (local retrieval is fast)
        createSelectionListener(this.sidebarIframe);
        createAnnotationListener(this.sidebarIframe);
    }

    async transitionOut() {
        removeSidebar();

        removeSelectionListener();
        removeAnnotationListener();
    }

    setShowSocialAnnotations(showSocialAnnotations: boolean) {
        sendSidebarEvent(this.sidebarIframe, {
            event: "setShowSocialAnnotations",
            showSocialAnnotations,
        });
    }

    // can't access iframe as from different origin, so send message instead
    async setSidebarCssVariable(key: string, value: string) {
        if (!this.sidebarLoaded) {
            await waitUntilIframeLoaded(this.sidebarIframe);
        }

        sendSidebarEvent(this.sidebarIframe, {
            event: "setCssVariable",
            key,
            value,
        });
    }

    async setSidebarDarkMode(darkModeEnabled: boolean) {
        if (!this.sidebarLoaded) {
            await waitUntilIframeLoaded(this.sidebarIframe);
        }

        sendSidebarEvent(this.sidebarIframe, {
            event: "setDarkMode",
            darkModeEnabled,
        });
    }

    private onAnnotationUpdate() {}
}
