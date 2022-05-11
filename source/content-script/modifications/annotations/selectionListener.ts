import { createDraftAnnotation } from "../../../common/annotations/create";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import { sendSidebarEvent } from "./annotationsListener";
import { AnnotationListener } from "./annotationsModifier";
import { highlightAnnotations } from "./highlightsApi";

// send user text selections to the sidebar iframe, in order to create an annotation
const listeners: [string, () => void][] = [];
export function createSelectionListener(
    sidebarIframe: HTMLIFrameElement,
    onAnnotationUpdate: AnnotationListener
) {
    // reset state on new user selection
    let processedStart = false;
    function onselectstart() {
        processedStart = false;
    }
    listeners.push(["selectstart", onselectstart]);

    // when selection changed, adjust start location to nearest word
    // can't seem to do this in onselectstart
    function onselectionchange() {
        const selection = document.getSelection();
        if (!selection.toString()) {
            return;
        }

        if (!processedStart) {
            processedStart = true;

            const range = selection.getRangeAt(0);
            const selectionBackwards = _isSelectionBackwards(selection);
            if (!selectionBackwards) {
                // expanding end does not seem to work for backwards ranges initially
                _expandRangeToWordBoundary(
                    range,
                    selectionBackwards ? "forwards" : "backwards"
                );
            }
        }
    }
    listeners.push(["selectionchange", onselectionchange]);

    // when selection done, expand to nearest word and highlight
    function onmouseup() {
        const selection = document.getSelection();
        if (!selection.toString()) {
            return;
        }

        const range = selection.getRangeAt(0);
        const selectionBackwards = _isSelectionBackwards(selection);
        _expandRangeToWordBoundary(
            range,
            selectionBackwards ? "backwards" : "forwards"
        );
        if (selectionBackwards) {
            // also adjust end since we couldn't on selection start (see above)
            _expandRangeToWordBoundary(range, "forwards");
        }

        _createAnnotationFromSelection((annotation) => {
            sendSidebarEvent(sidebarIframe, {
                event: "createHighlight",
                annotation,
            });
            onAnnotationUpdate("add", [annotation]);
        });
    }
    listeners.push(["mouseup", onmouseup]);

    // register listeners
    listeners.map(([event, handler]) =>
        document.addEventListener(event, handler)
    );
}

export function removeSelectionListener() {
    listeners.map(([event, handler]) =>
        document.removeEventListener(event, handler)
    );
}

function _isSelectionBackwards(sel: Selection) {
    // https://stackoverflow.com/a/60235039
    const tempRange = document.createRange();
    tempRange.setStart(sel.anchorNode, sel.anchorOffset);
    tempRange.setEnd(sel.focusNode, sel.focusOffset);

    const backwards = tempRange.collapsed;
    tempRange.detach();
    return backwards;
}

function _expandRangeToWordBoundary(
    range: Range,
    direction: "forwards" | "backwards"
) {
    if (direction === "forwards") {
        let wordEnd = range.endOffset; // exclusive
        const nodeValue = range.endContainer.nodeValue;
        while (
            wordEnd < nodeValue.length &&
            nodeValue[wordEnd].trim() &&
            nodeValue[wordEnd] !== "—"
        ) {
            wordEnd += 1;
        }

        // strip some punctuation
        if (",:".includes(nodeValue[wordEnd - 1])) {
            wordEnd -= 1;
        }

        range.setEnd(range.endContainer, wordEnd);
    } else if (direction === "backwards") {
        let wordStart = range.startOffset;
        const nodeValue = range.endContainer.nodeValue;
        while (
            wordStart - 1 >= 0 &&
            nodeValue[wordStart - 1].trim() &&
            nodeValue[wordStart - 1] !== "—"
        ) {
            wordStart -= 1;
        }

        range.setStart(range.startContainer, wordStart);
    }

    return range;
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
    annotation = {
        ...annotation,
        displayOffset: offsets[0].displayOffset,
        displayOffsetEnd: offsets[0].displayOffsetEnd,
    };

    // notify sidebar and upload logic
    callback(annotation);

    selection.empty();
}
