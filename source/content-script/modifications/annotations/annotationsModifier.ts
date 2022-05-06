import { LindyAnnotation } from "../../../common/annotations/create";
import {
    enableAnnotationsFeatureFlag,
    getFeatureFlag,
} from "../../../common/featureFlags";
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

    async afterTransitionIn() {
        const annotationsEnabled = await getFeatureFlag(
            enableAnnotationsFeatureFlag
        );
        if (annotationsEnabled) {
            this.enableAnnotations();
        }
    }

    async transitionOut() {
        this.disableAnnotations();
    }

    setEnableAnnotations(enableAnnotations: boolean) {
        if (enableAnnotations) {
            this.enableAnnotations();
        } else {
            this.disableAnnotations();
        }
    }

    private enableAnnotations() {
        this.sidebarIframe = injectSidebar();
        window.addEventListener("message", ({ data }) => {
            if (data.event === "sidebarIframeLoaded") {
                this.sidebarLoaded = true;
            }
        });

        // listeners need to be configured before rendering iframe to anchor annotations (local retrieval is fast)
        createSelectionListener(
            this.sidebarIframe,
            this.onAnnotationUpdate.bind(this)
        );
        createAnnotationListener(
            this.sidebarIframe,
            this.onAnnotationUpdate.bind(this)
        );

        // set theme variables if those are already configured
        if (this.darkModeEnabled !== null) {
            this.setSidebarDarkMode(this.darkModeEnabled);
        }
        Object.entries(this.cssVariables).map(([key, value]) =>
            this.setSidebarCssVariable(key, value)
        );
    }

    private disableAnnotations() {
        if (this.sidebarIframe) {
            removeSidebar();
        }
        this.sidebarLoaded = false;

        removeSelectionListener();
        removeAnnotationListener();
    }

    setShowSocialAnnotations(showSocialAnnotations: boolean) {
        sendSidebarEvent(this.sidebarIframe, {
            event: "setShowSocialAnnotations",
            showSocialAnnotations,
        });
    }

    private cssVariables: { [key: string]: string } = {};
    async setSidebarCssVariable(key: string, value: string) {
        this.cssVariables[key] = value;

        if (!this.sidebarIframe) {
            return;
        }
        if (!this.sidebarLoaded) {
            await waitUntilIframeLoaded(this.sidebarIframe);
        }

        // can't access iframe as from different origin, so send message instead
        sendSidebarEvent(this.sidebarIframe, {
            event: "setCssVariable",
            key,
            value,
        });
    }

    private darkModeEnabled: boolean = null;
    async setSidebarDarkMode(darkModeEnabled: boolean) {
        this.darkModeEnabled = darkModeEnabled;

        if (!this.sidebarIframe) {
            return;
        }
        if (!this.sidebarLoaded) {
            await waitUntilIframeLoaded(this.sidebarIframe);
        }

        sendSidebarEvent(this.sidebarIframe, {
            event: "setDarkMode",
            darkModeEnabled,
        });
    }

    public annotationListeners: AnnotationListener[] = [];

    // private fn passed to selection listener (added) and annotations side events listener (anchored, removed)
    private onAnnotationUpdate(
        action: "set" | "add" | "remove",
        annotations: LindyAnnotation[]
    ) {
        // console.log(action, annotations);
        this.annotationListeners.map((listener) =>
            listener(action, annotations)
        );
    }
}

export type AnnotationListener = (
    action: "set" | "add" | "remove",
    annotation: LindyAnnotation[]
) => void;
