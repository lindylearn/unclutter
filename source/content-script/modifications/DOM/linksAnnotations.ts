import { PageModifier, trackModifierExecution } from "../_interface";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import {
    createLinkAnnotation,
    LindyAnnotation,
} from "../../../common/annotations/create";
import { getNodeOffset } from "../../../common/annotations/offset";
import { sendSidebarEvent } from "../annotations/annotationsListener";
import AnnotationsModifier from "../annotations/annotationsModifier";
import { highlightRange } from "../../../common/annotator/highlighter";

/*
    Parse links inside the article text and create annotations for them.
*/
@trackModifierExecution
export default class LinkAnnotationsModifier implements PageModifier {
    // private annotationsModifier: AnnotationsModifier;
    // constructor(annotationsModifier: AnnotationsModifier) {
    //     this.annotationsModifier = annotationsModifier;
    // }

    annotations: LindyAnnotation[] = [];
    parseArticle() {
        const links = document.body.querySelectorAll("a");
        for (const link of links) {
            const annotation = this._createAnnotationFromLink(link);
            if (annotation) {
                this.annotations.push(annotation);
            }
        }
    }

    _createAnnotationFromLink(link: HTMLAnchorElement): LindyAnnotation | null {
        // Ignore invisible nodes
        if (link.offsetHeight === 0) {
            return null;
        }

        const href = link.getAttribute("href");
        if (!href || !href.startsWith("http")) {
            return null;
        }

        const range = document.createRange();
        range.selectNode(link);
        const selector = describeAnnotation(document.body, range);
        if (!selector) {
            return null;
        }

        const annotation = {
            ...createLinkAnnotation(window.location.href, selector, href),
            displayOffset: getNodeOffset(link),
            displayOffsetEnd: getNodeOffset(link, "bottom"),
        };

        // wrap link nodes to track offset changes
        // triggers DOM write phase
        highlightRange(annotation.id, range, "lindy-link-info");

        return annotation;
    }
}
