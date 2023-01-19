import browser from "../../../common/polyfill";
import { PageModifier, trackModifierExecution } from "../_interface";
import type AnnotationsModifier from "../annotations/annotationsModifier";
import { getUserInfoSimple } from "@unclutter/library-components/dist/common/messaging";

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

    async injectHighlightsScript() {
        // @ts-ignore
        if (window.unclutterHighlightsLoaded) {
            return;
        }
        const userInfo = await getUserInfoSimple();
        if (userInfo?.aiEnabled) {
            browser.runtime.sendMessage(null, {
                event: "requestEnhance",
                trigger: "enhance",
                type: "highlights",
            });
        }
    }

    private handleMessage(message: any) {
        // "setInfoAnnotations" and "changedDisplayOffset" sidebar events sent directly from smartHighlights.ts
    }
}
