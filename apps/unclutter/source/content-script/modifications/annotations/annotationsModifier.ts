import browser from "../../../common/polyfill";
import { LindyAnnotation } from "../../../common/annotations/create";
import { enableAnnotationsFeatureFlag, getFeatureFlag } from "../../../common/featureFlags";
import LinkAnnotationsModifier from "../DOM/linksAnnotations";
import { PageModifier, trackModifierExecution } from "../_interface";
import {
    createAnnotationListener,
    removeAnnotationListener,
    sendSidebarEvent,
    updateOffsetsOnHeightChange,
} from "./annotationsListener";
import { removeAllHighlights } from "./highlightsApi";
import { injectSidebar, removeSidebar, waitUntilIframeLoaded } from "./injectSidebar";
import { createSelectionListener, removeSelectionListener } from "./selectionListener";
import { getNodeOffset } from "../../../common/annotations/offset";

@trackModifierExecution
export default class AnnotationsModifier implements PageModifier {
    sidebarIframe: HTMLIFrameElement;
    sidebarLoaded: boolean = false;
    reactLoaded: boolean = false;

    private pageResizeObserver: ResizeObserver;

    constructor() {
        browser.runtime.onMessage.addListener(this.onRuntimeMessage.bind(this));
    }

    private initialScollHeight: number;
    readPageHeight() {
        this.initialScollHeight = document.body.scrollHeight;
    }

    async afterTransitionIn() {
        // always enable sidebar
        this.sidebarIframe = injectSidebar();
        window.addEventListener("message", ({ data }) => {
            if (data.event === "sidebarIframeLoaded") {
                // ready for css inject
                this.sidebarLoaded = true;
            } else if (data.event === "sidebarAppReady") {
                // react app loaded, can now handle events
                this.reactLoaded = true;
            }
        });

        // always created anchor listener to handle social comments
        createAnnotationListener(this.sidebarIframe, this.onAnnotationUpdate.bind(this));
        this.pageResizeObserver = updateOffsetsOnHeightChange(
            this.sidebarIframe,
            this.initialScollHeight
        );

        // annotations may be toggled independently
        const annotationsEnabled = await getFeatureFlag(enableAnnotationsFeatureFlag);
        if (annotationsEnabled) {
            this.enableAnnotations();
        }

        // set theme variables if those are already configured
        if (this.darkModeEnabled !== null) {
            this.setSidebarDarkMode(this.darkModeEnabled);
        }
        Object.entries(this.cssVariables).map(([key, value]) =>
            this.setSidebarCssVariable(key, value)
        );
    }

    async beforeTransitionOut() {
        this.disableAnnotations();
        removeAnnotationListener();
        this.pageResizeObserver?.disconnect();

        if (this.sidebarIframe) {
            removeSidebar();
        }
        this.sidebarLoaded = false;
    }

    setEnableAnnotations(enableAnnotations: boolean) {
        if (enableAnnotations) {
            this.enableAnnotations();
        } else {
            this.disableAnnotations();
        }
    }

    private enableAnnotations() {
        // listeners need to be configured before rendering iframe to anchor annotations?

        // selection is only user interface for annotations
        createSelectionListener(this.sidebarIframe, this.onAnnotationUpdate.bind(this));

        sendSidebarEvent(this.sidebarIframe, {
            event: "setEnablePersonalAnnotations",
            enablePersonalAnnotations: true,
        });
    }

    private disableAnnotations() {
        removeSelectionListener();
        removeAllHighlights(); // social annotations get re-anchored through below event

        sendSidebarEvent(this.sidebarIframe, {
            event: "setEnablePersonalAnnotations",
            enablePersonalAnnotations: false,
        });
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

    setInfoAnnotations(annotations: LindyAnnotation[]) {
        // ideally need to listen for reactLoaded event

        sendSidebarEvent(this.sidebarIframe, {
            event: "setInfoAnnotations",
            annotations: annotations,
        });
    }

    public annotationListeners: AnnotationListener[] = [];

    // private fn passed to selection listener (added) and annotations side events listener (anchored, removed)
    private onAnnotationUpdate(action: "set" | "add" | "remove", annotations: LindyAnnotation[]) {
        if (action === "set") {
            // called after paintHighlights event
            this.onAnnotationsVisible(annotations);
        }

        this.annotationListeners.map((listener) => listener(action, annotations));
    }

    private annotationsVisible: boolean = false;
    focusedAnnotation: string | null = null;
    private async onRuntimeMessage(message, sender, sendResponse) {
        if (message.event === "focusAnnotation") {
            if (this.annotationsVisible) {
                // only called from libray modal for now
                // leave time to disable scroll lock
                await new Promise((resolve) => setTimeout(resolve, 200));

                this.focusAnnotation(message.focusedAnnotation);
            } else {
                // scroll to annotation once anchored
                this.focusedAnnotation = message.focusedAnnotation;
            }
        }
    }

    private onAnnotationsVisible(annotations: LindyAnnotation[]) {
        if (annotations.length === 0) {
            // more annotations might get fetched later (and there is nothing to focus anyways)
            return;
        }

        if (this.focusedAnnotation) {
            this.focusAnnotation(this.focusedAnnotation);

            // ignore further repositioning
            this.focusedAnnotation = null;
        }

        this.annotationsVisible = true;
    }

    private focusAnnotation(annotationId: string) {
        const node = document.getElementById(annotationId);
        if (!node) {
            console.log(`Could not find focused annotation ${annotationId}`);
            return;
        }

        // node.click(); // seems to break smooth scroll
        window.scrollTo({
            top: getNodeOffset(node) - 100,
            behavior: "smooth",
        });
    }
}

export type AnnotationListener = (
    action: "set" | "add" | "remove",
    annotation: LindyAnnotation[]
) => void;
