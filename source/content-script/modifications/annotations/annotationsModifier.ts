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

    transitionIn() {
        // insert iframe earlier so ThemeModifier can inject theme variables
        this.sidebarIframe = injectSidebar();
    }

    async afterTransitionIn() {
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
