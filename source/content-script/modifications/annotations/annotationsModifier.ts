import { PageModifier, trackModifierExecution } from "../_interface";
import {
    createAnnotationListener,
    removeAnnotationListener,
} from "./annotationsListener";
import { injectSidebar, removeSidebar } from "./injectSidebar";
import {
    createSelectionListener,
    removeSelectionListener,
} from "./selectionListener";

@trackModifierExecution
export default class AnnotationsModifier implements PageModifier {
    private sidebarIframe: HTMLIFrameElement;

    async afterTransitionIn() {
        this.sidebarIframe = injectSidebar();

        createSelectionListener(this.sidebarIframe);
        createAnnotationListener(this.sidebarIframe);
    }

    async transitionOut() {
        removeSidebar();

        removeSelectionListener();
        removeAnnotationListener();
    }

    setShowSocialAnnotations(showSocialAnnotations: boolean) {
        this.sidebarIframe.contentWindow.postMessage(
            {
                event: "setShowSocialAnnotations",
                showSocialAnnotations,
            },
            "*"
        );
    }
}
