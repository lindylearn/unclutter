import throttle from "lodash/throttle";
import { AnnotationListener } from "./annotationsModifier";
import {
    addHighlightDot,
    anchorAnnotations,
    getHighlightOffsets,
    hoverUpdateHighlight,
    paintHighlight,
    removeAllHighlights,
    removeHighlight,
} from "./highlightsApi";
import { sendIframeEvent } from "../../../common/reactIframe";

let listenerRef;
export function createAnnotationListener(
    sidebarIframe: HTMLIFrameElement,
    onAnnotationUpdate: AnnotationListener
) {
    // highlight new sent annotations, and send back display offsets
    const onMessage = async function ({ data }) {
        if (!sidebarIframe.contentWindow) {
            window.removeEventListener("message", this);
            return;
        }

        if (data.event == "anchorAnnotations") {
            const start = performance.now();

            // anchor only called with all complete annotations
            removeAllHighlights();
            const anchoredAnnotations = await anchorAnnotations(data.annotations, sidebarIframe);

            const duration = performance.now() - start;
            console.info(
                `anchored ${data.annotations.length} annotations on page in ${Math.round(
                    duration
                )}ms`
            );

            // send response
            sendIframeEvent(sidebarIframe, {
                event: "anchoredAnnotations",
                annotations: anchoredAnnotations,
            });
        } else if (data.event === "paintHighlights") {
            data.annotations.map((a) => paintHighlight(a, sidebarIframe));

            onAnnotationUpdate("set", data.annotations);
        } else if (data.event === "removeHighlights") {
            data.annotations.map(removeHighlight);

            onAnnotationUpdate("remove", data.annotations);
        } else if (data.event === "onAnnotationHoverUpdate") {
            hoverUpdateHighlight(data.annotation, data.hoverActive);
        } else if (data.event === "showHighlightDotsFor") {
            data.annotations.map((a) => addHighlightDot(a, sidebarIframe));
        }
    };
    window.addEventListener("message", onMessage);
    listenerRef = onMessage;
}

export function removeAnnotationListener() {
    window.removeEventListener("message", listenerRef);
    removeAllHighlights();
}

export function updateOffsetsOnHeightChange(
    sidebarIframe: HTMLIFrameElement,
    initialScollHeight: number
): ResizeObserver {
    return _observeHeightChange(document, initialScollHeight, () => {
        if (!sidebarIframe.contentWindow) {
            return;
        }
        console.info(`page resized, recalculating annotation offsets...`);

        const highlightNodes = [
            ...document.body.querySelectorAll("lindy-highlight, a.lindy-link-info"),
        ];

        const [offsetById, offsetEndById] = getHighlightOffsets(highlightNodes);
        sendIframeEvent(sidebarIframe, {
            event: "changedDisplayOffset",
            offsetById,
            offsetEndById,
        });
        // don't call onAnnotationUpdate() as it's only used for outline grouping for now
        // page resizing should keep relative position to headings intact
    });
}

function _observeHeightChange(
    document: Document,
    initialScollHeight: number,
    callback: () => void
) {
    const throttledCallback = throttle(callback, 2000);

    let oldHeight = initialScollHeight;
    const resizeObserver = new ResizeObserver((entries) => {
        const newHeight = entries[0].target.scrollHeight;

        if (newHeight !== oldHeight) {
            throttledCallback();
            oldHeight = newHeight;
        }
    });

    resizeObserver.observe(document.body);
    return resizeObserver;
}
