import { createDraftAnnotation } from "../../../common/annotations/create";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import { sendSidebarEvent } from "./annotationsListener";
import { AnnotationListener } from "./annotationsModifier";
import { highlightAnnotations } from "./highlightsApi";

// send user text selections to the sidebar iframe, in order to create an annotation
let listenerRef;
export function createSelectionListener(
    sidebarIframe: HTMLIFrameElement,
    onAnnotationUpdate: AnnotationListener
) {
    const mouseupHandler = () =>
        _createAnnotationFromSelection((annotation) => {
            sendSidebarEvent(sidebarIframe, {
                event: "createHighlight",
                annotation,
            });
            onAnnotationUpdate("add", [annotation]);
        });
    document.addEventListener("mouseup", mouseupHandler);
    listenerRef = mouseupHandler;
}

export function removeSelectionListener() {
    document.removeEventListener("mouseup", listenerRef);
}

async function _createAnnotationFromSelection(callback) {
    // get mouse selection
    const selection = document.getSelection();
    if (!selection || !selection.toString().trim()) {
        return;
    }
    const range = selection.getRangeAt(0);

    // convert to text anchor
    const annotationSelector = describeAnnotation(document.body, range);
    if (!annotationSelector) {
        return;
    }

    // create highlight
    let annotation = createDraftAnnotation(
        window.location.href,
        annotationSelector
    );
    const offsets = await highlightAnnotations([annotation]);
    annotation = { ...annotation, displayOffset: offsets[0].displayOffset };

    // notify sidebar and upload logic
    callback(annotation);

    selection.empty();
}
