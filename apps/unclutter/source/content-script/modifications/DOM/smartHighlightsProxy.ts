import { PageModifier, trackModifierExecution } from "../_interface";
import type AnnotationsModifier from "../annotations/annotationsModifier";

// communicate with a SmartHighlightsModifier instance inside the same window
@trackModifierExecution
export default class SmartHighlightsProxy implements PageModifier {
    private articleId: string;
    private annotationsModifier: AnnotationsModifier;

    constructor(articleId: string, annotationsModifier: AnnotationsModifier) {
        this.articleId = articleId;
        this.annotationsModifier = annotationsModifier;

        window.addEventListener("message", (event) => this.handleMessage(event.data || {}));
    }

    private handleMessage(message: any) {
        // "setInfoAnnotations" and "changedDisplayOffset" sidebar events sent directly from smartHighlights.ts
    }
}
