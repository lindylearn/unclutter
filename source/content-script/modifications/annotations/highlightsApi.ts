import { LindyAnnotation } from "../../../common/annotations/create";
import { getNodeOffset } from "../../../common/annotations/offset";
import { getAnnotationColor } from "../../../common/annotations/styling";
import { anchor as anchorHTML } from "../../../common/annotator/anchoring/html";
import {
    highlightRange,
    removeAllHighlights as removeAllHighlightsApi,
    removeHighlights as removeHighlightsApi,
} from "../../../common/annotator/highlighter";
import { overrideClassname } from "../../../common/stylesheets";
import { sendSidebarEvent } from "./annotationsListener";

// highlight text for every passed annotation on the active webpage
export async function highlightAnnotations(
    annotations: LindyAnnotation[],
    sidebarIframe: HTMLIFrameElement
) {
    const body = document.body;

    const anchoredAnnotations = [];
    await Promise.all(
        annotations.map(async (annotation) => {
            try {
                const range = await anchorHTML(
                    body,
                    annotation.quote_html_selector as any[]
                );
                if (!range) {
                    // e.g. selection removed?
                    return;
                }

                const highlightedNodes = highlightRange(
                    annotation.localId,
                    range,
                    annotation.isMyAnnotation
                        ? "lindy-highlight"
                        : "lindy-crowd-highlight"
                );
                if (!highlightedNodes) {
                    throw Error("includes no highlighted nodes");
                }

                // always set color
                let annotationColor: string;
                let darkerAnnotationColor: string;
                if (annotation.isMyAnnotation) {
                    annotationColor = getAnnotationColor(annotation);
                    darkerAnnotationColor = annotationColor.replace(
                        "0.3",
                        "0.5"
                    );
                } else {
                    annotationColor =
                        annotation.platform === "hn"
                            ? "rgba(255, 102, 0, 0.5)"
                            : "rgba(189, 28, 43, 0.5)";
                    darkerAnnotationColor = annotationColor.replace(
                        "0.5",
                        "0.8"
                    );
                }
                highlightedNodes.map((node) => {
                    node.style.setProperty(
                        "--annotation-color",
                        annotationColor
                    );
                    node.style.setProperty(
                        "--darker-annotation-color",
                        darkerAnnotationColor
                    );
                });

                // get position on page
                const displayOffset = getNodeOffset(highlightedNodes[0]);
                const displayOffsetEnd = getNodeOffset(
                    highlightedNodes[highlightedNodes.length - 1],
                    "bottom"
                );

                // handle onclick (a highlight may comprise multiple text nodes)
                highlightedNodes.map((node) => {
                    node.onclick = () => {
                        hoverUpdateHighlight(annotation, true);

                        sendSidebarEvent(sidebarIframe, {
                            event: "focusAnnotation",
                            localId: annotation.localId,
                        });

                        // unfocus on next click (clicks inside annotations sidebar are handled there)
                        const onNextClick = () => {
                            hoverUpdateHighlight(annotation, false);
                            sendSidebarEvent(sidebarIframe, {
                                event: "focusAnnotation",
                                localId: null,
                            });

                            document.removeEventListener(
                                "click",
                                onNextClick,
                                true
                            );
                        };
                        document.addEventListener("click", onNextClick, true);
                    };

                    // node.onmouseenter = () => {
                    //     hoverUpdateHighlight(annotation, true);

                    //     sendSidebarEvent(sidebarIframe, {
                    //         event: "focusAnnotation",
                    //         localId: annotation.localId,
                    //     });
                    // };
                    // node.onmouseleave = () => {
                    //     hoverUpdateHighlight(annotation, false);
                    //     sendSidebarEvent(sidebarIframe, {
                    //         event: "focusAnnotation",
                    //         localId: null,
                    //     });
                    // };
                });

                anchoredAnnotations.push({
                    ...annotation,
                    displayOffset,
                    displayOffsetEnd,
                });
            } catch (err) {
                console.error(
                    `Could not anchor annotation with id`,
                    annotation.id
                );
            }
        })
    );

    // insertMarginBar(anchoredAnnotations, sidebarIframe);

    return anchoredAnnotations;
}

function insertMarginBar(
    anchoredAnnotations: LindyAnnotation[],
    sidebarIframe: HTMLIFrameElement
) {
    const container = document.createElement("div");
    container.className = overrideClassname;
    container.id = "lindy-annotations-marginbar";
    document.body.appendChild(container);

    const bodyOffset = getNodeOffset(document.body);
    anchoredAnnotations.map((annotation) => {
        if (annotation.isMyAnnotation) {
            return;
        }

        const barElement = document.createElement("div");

        barElement.className = "lindy-marginbar-dot";
        barElement.style.top = `${
            annotation.displayOffset - bodyOffset + 10
        }px`;
        // barElement.style.height = `${
        //     annotation.displayOffsetEnd - annotation.displayOffset
        // }px`;

        const annotationColor =
            annotation.platform === "hn"
                ? "rgba(255, 102, 0, 0.5)"
                : "rgba(189, 28, 43, 0.5)";
        const darkerAnnotationColor = annotationColor.replace("0.5", "0.8");
        barElement.style.setProperty(
            "--darker-annotation-color",
            darkerAnnotationColor
        );

        barElement.onmouseenter = () => {
            hoverUpdateHighlight(annotation, true);

            sendSidebarEvent(sidebarIframe, {
                event: "focusAnnotation",
                localId: annotation.localId,
            });
        };

        container.appendChild(barElement);
    });
}

// remove all text highlighting
export function removeAllHighlights() {
    [...document.querySelectorAll(".lindy-highlight-dot")].map((node) =>
        node.remove()
    );

    removeAllHighlightsApi(document.body);
}

function getAnnotationNodes(annotation): HTMLElement[] {
    const nodeList = document.querySelectorAll(
        `lindy-highlight[id="${annotation.localId}"]`
    );
    return [...nodeList] as HTMLElement[];
}

// remove a specific text highlighting
export function removeHighlight(annotation) {
    document
        .querySelector(
            `lindy-highlight[id="${annotation.localId}"] > .lindy-highlight-dot`
        )
        ?.remove();

    const nodes = getAnnotationNodes(annotation);
    removeHighlightsApi(nodes);
}

// get the Y position of all text highlighlights
export function getHighlightOffsets() {
    const body = document.body;

    const highlightNodes = [...body.querySelectorAll("lindy-highlight")];

    // highlight may include multiple nodes across html tags
    // so iterate nodes in sequence and only take the first offset
    const offsetById = {};
    const offsetEndById = {};
    for (const node of highlightNodes) {
        // use first node for start offset
        if (!offsetById[node.id]) {
            offsetById[node.id] = getNodeOffset(node);
        }

        // use last node for end offset
        offsetEndById[node.id] = getNodeOffset(node, "bottom");
    }

    return [offsetById, offsetEndById];
}

export function hoverUpdateHighlight(
    annotation: LindyAnnotation,
    hoverActive: boolean
) {
    const nodes = getAnnotationNodes(annotation);

    if (hoverActive) {
        nodes.map((node) => {
            node.classList.add("lindy-hover");
        });
    } else {
        nodes.map((node) => {
            node.classList.remove("lindy-hover");
        });
    }
}

export function addHighlightDot(
    annotation: LindyAnnotation,
    sidebarIframe: HTMLIFrameElement
) {
    const nodes = getAnnotationNodes(annotation);
    const anchorNode = nodes[nodes.length - 1];

    if (anchorNode.getElementsByClassName("lindy-highlight-dot").length !== 0) {
        return;
    }

    const dotNode = document.createElement("lindy-dot");
    dotNode.classList.add("lindy-highlight-dot");
    anchorNode.insertBefore(dotNode, null);

    dotNode.onmouseenter = () => {
        hoverUpdateHighlight(annotation, true);

        sendSidebarEvent(sidebarIframe, {
            event: "focusAnnotation",
            localId: annotation.localId,
        });
    };
    dotNode.onmouseleave = () => {
        hoverUpdateHighlight(annotation, false);
    };
    dotNode.onclick = () => {
        sendSidebarEvent(sidebarIframe, {
            event: "focusAnnotation",
            localId: annotation.localId,
        });
    };
}
