import {
    createDraftAnnotation,
    generateId,
    LindyAnnotation,
} from "../../../common/annotations/create";
import { getRandomColor } from "../../../common/annotations/styling";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import { createStylesheetText } from "../../../common/stylesheets";
import { sendSidebarEvent } from "./annotationsListener";
import { AnnotationListener } from "./annotationsModifier";
import {
    anchorAnnotations,
    copyTextToClipboard,
    getAnnotationNodes,
    paintHighlight,
} from "./highlightsApi";

// send user text selections to the sidebar iframe, in order to create an annotation
const listeners: [string, () => void][] = [];
export function createSelectionListener(
    sidebarIframe: HTMLIFrameElement,
    onAnnotationUpdate: AnnotationListener
) {
    // reset state on new user selection / click
    let activeAnnotationId: string | null = null;
    let processedStart = false;
    function onselectstart() {
        processedStart = false;
    }
    listeners.push(["selectstart", onselectstart]);

    // when selection changed, adjust start location to nearest word
    // can't yet do this in onselectstart
    function onselectionchange() {
        const selection = document.getSelection();
        if (!selection.toString()) {
            return;
        }

        if (!processedStart) {
            processedStart = true;

            activeAnnotationId = generateId();
            document.documentElement.style.setProperty(
                "--selection-background",
                getRandomColor(activeAnnotationId)
            );

            const range = selection.getRangeAt(0);
            const selectionBackwards = _isSelectionBackwards(selection);
            if (!selectionBackwards) {
                // expanding end does not seem to work for backwards ranges initially
                _expandRangeToWordBoundary(range, selectionBackwards ? "forwards" : "backwards");
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
        _expandRangeToWordBoundary(range, selectionBackwards ? "backwards" : "forwards");
        if (selectionBackwards) {
            // also adjust end since we couldn't on selection start (see above)
            _expandRangeToWordBoundary(range, "forwards");
        }

        _createAnnotationFromSelection(
            (annotation) => {
                sendSidebarEvent(sidebarIframe, {
                    event: "createHighlight",
                    annotation,
                });
                onAnnotationUpdate("add", [annotation]);
            },
            sidebarIframe,
            activeAnnotationId
        );
    }
    listeners.push(["mouseup", onmouseup]);

    // register listeners
    listeners.map(([event, handler]) => document.addEventListener(event, handler));

    // insert dynamically to not show transparent selection once highlights disabled
    createStylesheetText(
        `::selection {
            background-color: var(--selection-background) !important;
        }`,
        "lindy-highlight-selection"
    );
}

export function removeSelectionListener() {
    listeners.map(([event, handler]) => document.removeEventListener(event, handler));

    document.getElementById("lindy-highlight-selection")?.remove();
    document.documentElement.style.removeProperty("--selection-background");
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

function _expandRangeToWordBoundary(range: Range, direction: "forwards" | "backwards") {
    try {
        if (direction === "forwards") {
            let wordEnd = range.endOffset; // exclusive
            const nodeValue = range.endContainer.nodeValue;
            while (
                nodeValue &&
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
                nodeValue[wordStart - 1]?.trim() &&
                nodeValue[wordStart - 1] !== "—"
            ) {
                wordStart -= 1;
            }

            range.setStart(range.startContainer, wordStart);
        }
    } catch (err) {
        console.error(err);
    }

    return range;
}

async function _createAnnotationFromSelection(
    callback: (newAnnotation: LindyAnnotation) => void,
    sidebarIframe: HTMLIFrameElement,
    activeAnnotationId: string
) {
    console.log("_createAnnotationFromSelection", activeAnnotationId);
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

    // use id created during selection to keep same color
    let annotation = createDraftAnnotation(window.location.href, annotationSelector);
    annotation.localId = activeAnnotationId;
    annotation.focused = true;

    // wrap with custom html node
    const offsets = await anchorAnnotations([annotation], sidebarIframe);
    annotation.displayOffset = offsets[0].displayOffset;
    annotation.displayOffsetEnd = offsets[0].displayOffsetEnd;

    // add styling
    const highlightedNodes = getAnnotationNodes(annotation);
    paintHighlight(annotation, sidebarIframe, highlightedNodes);

    // notify sidebar and upload logic
    callback(annotation);

    copyTextToClipboard(annotation.quote_text);
    selection.removeAllRanges();
}
