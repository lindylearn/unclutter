import browser from "../../../common/polyfill";
import { LindyAnnotation } from "../../../common/annotations/create";
import { enableAnnotationsFeatureFlag, getFeatureFlag } from "../../../common/featureFlags";
import { PageModifier, trackModifierExecution } from "../_interface";
import {
    createAnnotationListener,
    removeAnnotationListener,
    updateOffsetsOnHeightChange,
} from "./annotationsListener";
import { removeAllHighlights } from "./highlightsApi";
import {
    injectReactIframe,
    removeReactIframe,
    sendIframeEvent,
    waitUntilIframeLoaded,
} from "../../../common/reactIframe";
import { createSelectionListener, removeSelectionListener } from "./selectionListener";
import { getNodeOffset } from "../../../common/annotations/offset";

@trackModifierExecution
export default class AnnotationsModifier implements PageModifier {
    private articleId: string;

    sidebarIframe: HTMLIFrameElement;
    private sidebarLoaded: boolean = false;
    private reactLoaded: boolean = false;
    private pageResizeObserver: ResizeObserver;

    constructor(articleId: string) {
        this.articleId = articleId;
        browser.runtime.onMessage.addListener(this.onRuntimeMessage.bind(this));
    }

    private initialScollHeight: number;
    readPageHeight() {
        this.initialScollHeight = document.body.scrollHeight;
    }

    async afterTransitionIn() {
        // always enable sidebar
        this.sidebarIframe = injectReactIframe("/sidebar/index.html", "lindy-annotations-bar", {
            articleId: this.articleId,
            darkModeEnabled: (this.darkModeEnabled || false).toString(),
            sourceAnnotationId: this.focusedAnnotation,
        });
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
        createAnnotationListener(this.sidebarIframe, this.onAnnotationsVisible.bind(this));
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
            this.setDarkMode(this.darkModeEnabled);
        }
        Object.entries(this.cssVariables).map(([key, value]) => this.setCssVariable(key, value));
    }

    async beforeTransitionOut() {
        this.disableAnnotations();
        removeAnnotationListener();
        this.pageResizeObserver?.disconnect();

        if (this.sidebarIframe) {
            removeReactIframe("lindy-annotations-bar");
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
        createSelectionListener(
            this.articleId,
            this.sidebarIframe,
        );

        sendIframeEvent(this.sidebarIframe, {
            event: "setEnablePersonalAnnotations",
            enablePersonalAnnotations: true,
        });
    }

    private disableAnnotations() {
        removeSelectionListener();
        removeAllHighlights(); // social annotations get re-anchored through below event

        sendIframeEvent(this.sidebarIframe, {
            event: "setEnablePersonalAnnotations",
            enablePersonalAnnotations: false,
        });
    }

    setShowSocialAnnotations(showSocialAnnotations: boolean) {
        sendIframeEvent(this.sidebarIframe, {
            event: "setShowSocialAnnotations",
            showSocialAnnotations,
        });
    }

    private cssVariables: { [key: string]: string } = {};
    async setCssVariable(key: string, value: string) {
        this.cssVariables[key] = value;

        if (!this.sidebarIframe) {
            return;
        }
        if (!this.sidebarLoaded) {
            await waitUntilIframeLoaded(this.sidebarIframe);
        }

        // can't access iframe as from different origin, so send message instead
        sendIframeEvent(this.sidebarIframe, {
            event: "setCssVariable",
            key,
            value,
        });
    }

    private darkModeEnabled: boolean = null;
    async setDarkMode(darkModeEnabled: boolean) {
        this.darkModeEnabled = darkModeEnabled;

        if (!this.sidebarIframe) {
            return;
        }
        if (!this.sidebarLoaded) {
            await waitUntilIframeLoaded(this.sidebarIframe);
        }

        sendIframeEvent(this.sidebarIframe, {
            event: "setDarkMode",
            darkModeEnabled,
        });
    }

    setInfoAnnotations(annotations: LindyAnnotation[]) {
        // ideally need to listen for reactLoaded event

        sendIframeEvent(this.sidebarIframe, {
            event: "setInfoAnnotations",
            annotations: annotations,
        });
    }

    private annotationsVisible: boolean = false;
    focusedAnnotation: string | null = null;
    private async onRuntimeMessage(message, sender, sendResponse) {
        if (message.event === "focusAnnotation") {
            console.log("focus", message, this.annotationsVisible)
            if (this.annotationsVisible) {
                if (message.source === "modal") {
                    // wait until modal scroll-lock disabled
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }

                this.focusAnnotation(message.annotationId);
            } else {
                // scroll to annotation once anchored
                this.focusedAnnotation = message.annotationId;
            }
        }
    }

    private async onAnnotationsVisible(annotations: LindyAnnotation[]) {
        console.log("anchored", annotations)
        if (this.annotationsVisible) {
            // run only once
            return
        }
        if (annotations.length === 0) {
            // more annotations might get fetched later (and there is nothing to focus anyways)
            return;
        }

        if (this.focusedAnnotation) {
            await new Promise((resolve) => setTimeout(resolve, 200));

            this.focusAnnotation(this.focusedAnnotation);

            // ignore further repositioning
            this.focusedAnnotation = null;
        }

        this.annotationsVisible = true;
    }

    private async focusAnnotation(annotationId: string) {
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

        sendIframeEvent(this.sidebarIframe, {
            event: "focusAnnotation",
            annotationId,
        });
    }
}

export type AnnotationListener = (
    action: "set" | "add" | "remove",
    annotation: LindyAnnotation[]
) => void;
