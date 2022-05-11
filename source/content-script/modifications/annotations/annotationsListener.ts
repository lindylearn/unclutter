import throttle from "lodash/throttle";
import { AnnotationListener } from "./annotationsModifier";
import {
    getHighlightOffsets,
    highlightAnnotations,
    paintHighlight,
    removeAllHighlights,
    removeHighlight,
    unPaintHighlight,
} from "./highlightsApi";

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
            console.info(
                `anchoring ${data.annotations.length} annotations on page...`
            );

            const anchoredAnnotations = await highlightAnnotations(
                data.annotations
            );
            sendSidebarEvent(sidebarIframe, {
                event: "anchoredAnnotations",
                annotations: anchoredAnnotations,
            });
            onAnnotationUpdate("set", anchoredAnnotations);
        } else if (data.event === "removeHighlight") {
            removeHighlight(data.annotation);
            onAnnotationUpdate("remove", [data.annotation]);
        } else if (data.event === "onAnnotationHoverUpdate") {
            if (data.hoverActive) {
                const color =
                    data.annotation.platform === "hn"
                        ? "rgba(255, 102, 0, 0.5)"
                        : "rgba(189, 28, 43, 0.5)";
                paintHighlight(data.annotation, color);
            } else {
                unPaintHighlight(data.annotation);
            }
        }
    };
    window.addEventListener("message", onMessage);
    listenerRef = onMessage;

    // update offsets if the page changes (e.g. after insert of mobile css)
    _observeHeightChange(document, () => {
        if (!sidebarIframe.contentWindow) {
            resizeObserver?.unobserve(document.body);
            return;
        }

        console.info(`page resized, recalculating annotation offsets...`);
        const offsetById = getHighlightOffsets();
        sendSidebarEvent(sidebarIframe, {
            event: "changedDisplayOffset",
            offsetById,
        });
        // don't call onAnnotationUpdate() as it's only used for outline grouping for now
        // page resizing should keep relative position to headings intact
    });
}

export function removeAnnotationListener() {
    window.removeEventListener("message", listenerRef);
    resizeObserver?.unobserve(document.body);
    removeAllHighlights();
}

let resizeObserver;
function _observeHeightChange(document, callback) {
    const throttledCallback = throttle(callback, 2000);

    let oldHeight = document.body.scrollHeight;
    resizeObserver = new ResizeObserver((entries) => {
        const newHeight = entries[0].target.scrollHeight;

        if (newHeight !== oldHeight) {
            throttledCallback(document.body.scrollHeight + "px");
            oldHeight = newHeight;
        }
    });

    resizeObserver.observe(document.body);
}

export function sendSidebarEvent(
    sidebarIframe: HTMLIFrameElement,
    event: object
) {
    sidebarIframe.contentWindow?.postMessage(event, "*");
}
