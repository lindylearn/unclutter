import { injectSidebar, removeSidebar } from "../annotations/injectSidebar";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class AnnotationsManager implements PageModifier {
    async afterTransitionIn() {
        injectSidebar();
    }

    async transitionOut() {
        removeSidebar();
    }
}
