import throttle from "lodash/throttle";
import {
    anchorAnnotations,
    getHighlightOffsets,
    hoverUpdateHighlight,
    paintHighlight,
    removeAllHighlights,
    removeHighlight,
} from "./highlightsApi";
import { sendIframeEvent } from "../../../common/reactIframe";
import { LindyAnnotation } from "../../../common/annotations/create";

let listenerRef;
export function createAnnotationListener(
    sidebarIframe: HTMLIFrameElement,
    onAnchored: (annotations: LindyAnnotation[]) => void
) {
    // highlight new sent annotations, and send back display offsets
    const onMessage = async function ({ data }) {
        if (!sidebarIframe.contentWindow) {
            window.removeEventListener("message", this);
            return;
        }

        if (data.event == "anchorAnnotations") {
            const start = performance.now();

            if (data.removePrevious) {
                removeAllHighlights();
            }
            const [offsetById, offsetEndById] = await anchorAnnotations(data.annotations);

            const duration = performance.now() - start;
            console.info(
                `anchored ${data.annotations.length} annotations on page in ${Math.round(
                    duration
                )}ms`
            );

            // send response
            sendIframeEvent(sidebarIframe, {
                ...data,
                event: "anchoredAnnotations",
                annotations: data.annotations,
                offsetById,
                offsetEndById,
            });
            onAnchored(data.annotations);
        } else if (data.event === "paintHighlights") {
            data.annotations.map((a) => paintHighlight(a, sidebarIframe));
        } else if (data.event === "removeHighlights") {
            data.annotations.map(removeHighlight);
        } else if (data.event === "onAnnotationHoverUpdate") {
            hoverUpdateHighlight(data.annotation, data.hoverActive);
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
        console.info(`Page resized, recalculating annotation offsets...`);

        // notifies of node position change
        // smart highlights handled seperately in smartHighlights.ts
        const highlightNodes = [
            ...document.body.querySelectorAll("lindy-highlight, a.lindy-link-info"),
        ] as HTMLElement[];
        if (highlightNodes.length === 0) {
            return;
        }

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
