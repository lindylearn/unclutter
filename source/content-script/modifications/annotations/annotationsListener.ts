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
            const anchoredAnnotations = await anchorAnnotations(
                data.annotations,
                sidebarIframe
            );

            const duration = performance.now() - start;
            console.info(
                `anchored ${
                    data.annotations.length
                } annotations on page in ${Math.round(duration)}ms`
            );

            // send response
            sendSidebarEvent(sidebarIframe, {
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
