import throttle from "lodash/throttle";
import { getAnnotationColor } from "../../../common/annotations/styling";
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
            const start = performance.now();

            removeAllHighlights(); // anchor only called with all active annotations, so can remove & re-paint
            const anchoredAnnotations = await highlightAnnotations(
                data.annotations
            );
            sendSidebarEvent(sidebarIframe, {
                event: "anchoredAnnotations",
                annotations: anchoredAnnotations,
            });
            onAnnotationUpdate("set", anchoredAnnotations);

            const duration = performance.now() - start;
            console.info(
                `anchored ${
                    data.annotations.length
                } annotations on page in ${Math.round(duration)}ms`
            );
        } else if (data.event === "removeHighlights") {
            data.annotations.map(removeHighlight);

            onAnnotationUpdate("remove", data.annotations);
        } else if (data.event === "onAnnotationHoverUpdate") {
            if (data.annotation.isMyAnnotation) {
                // darken highlight
                const defaultColor = getAnnotationColor(data.annotation);
                const darkenedColor = defaultColor.replace("0.3", "0.5");

                if (data.hoverActive) {
                    paintHighlight(data.annotation, darkenedColor);
                } else {
                    paintHighlight(data.annotation, defaultColor);
                }
            } else {
                // create highlight
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
        const [offsetById, offsetEndById] = getHighlightOffsets();
        sendSidebarEvent(sidebarIframe, {
            event: "changedDisplayOffset",
            offsetById,
            offsetEndById,
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
