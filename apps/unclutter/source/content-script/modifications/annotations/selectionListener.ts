import {
    createDraftAnnotation,
    generateId,
    LindyAnnotation,
} from "../../../common/annotations/create";
import { getRandomColor } from "../../../common/annotations/styling";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import { sendIframeEvent } from "../../../common/reactIframe";
import { createStylesheetText } from "../../../common/stylesheets";
import type { AnnotationListener } from "./annotationsModifier";

// send user text selections to the sidebar iframe, in order to create an annotation
const listeners: [string, () => void][] = [];
export function createSelectionListener(
    articleId: string,
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
        if (!selection.toString().trim()) {
            return;
        }

        const range = selection.getRangeAt(0);
        const selectionBackwards = _isSelectionBackwards(selection);
        _expandRangeToWordBoundary(range, selectionBackwards ? "backwards" : "forwards");
        if (selectionBackwards) {
            // also adjust end since we couldn't on selection start (see above)
            _expandRangeToWordBoundary(range, "forwards");
        }

        const selector = describeAnnotation(document.body, range);
        if (!selector) {
            return;
        }

        let annotation = createDraftAnnotation(articleId, selector);
        annotation.id = activeAnnotationId;

        sendIframeEvent(sidebarIframe, {
            event: "createHighlight",
            annotation,
        });
        onAnnotationUpdate("add", [annotation]);

        selection.removeAllRanges();
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
    const boundaryChars = ".;!?—".split("");
    try {
        if (direction === "forwards") {
            let wordEnd = range.endOffset; // exclusive
            const nodeValue = range.endContainer.nodeValue;
            while (
                nodeValue &&
                wordEnd < nodeValue.length &&
                !boundaryChars.includes(nodeValue[wordEnd - 1])
            ) {
                wordEnd += 1;
            }

            // strip some punctuation
            if (",:".includes(nodeValue[wordEnd])) {
                wordEnd -= 1;
            }

            range.setEnd(range.endContainer, Math.min(nodeValue.length, wordEnd));
        } else if (direction === "backwards") {
            let wordStart = range.startOffset;
            const nodeValue = range.startContainer.nodeValue;
            while (wordStart > 0 && !boundaryChars.includes(nodeValue[wordStart - 2])) {
                wordStart -= 1;
            }

            range.setStart(range.startContainer, Math.max(0, wordStart));
        }
    } catch (err) {
        console.error(err);
    }

    return range;
}
