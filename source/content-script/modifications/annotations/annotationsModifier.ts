import { PageModifier, trackModifierExecution } from "../_interface";
import {
    createAnnotationListener,
    removeAnnotationListener,
    sendSidebarEvent,
} from "./annotationsListener";
import { injectSidebar, removeSidebar } from "./injectSidebar";
import {
    createSelectionListener,
    removeSelectionListener,
} from "./selectionListener";

@trackModifierExecution
export default class AnnotationsModifier implements PageModifier {
    private sidebarIframe: HTMLIFrameElement;

    afterTransitionIn() {
        this.sidebarIframe = injectSidebar();

        // listeners need to be configured before rendering iframe, to anchor annotations (local retrieval is fast)
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
}
