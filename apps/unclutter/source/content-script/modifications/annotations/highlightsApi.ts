import { LindyAnnotation } from "../../../common/annotations/create";
import { getNodeOffset } from "../../../common/annotations/offset";
import { getAnnotationColorNew } from "../../../common/annotations/styling";
import { anchor as anchorHTML } from "../../../common/annotator/anchoring/html";
import {
    highlightRange,
    removeAllHighlights as removeAllHighlightsApi,
    removeHighlights as removeHighlightsApi,
} from "../../../common/annotator/highlighter";
import { overrideClassname } from "../../../common/stylesheets";
import { sendIframeEvent } from "../../../common/reactIframe";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import { deleteAnnotationVectors } from "@unclutter/library-components/dist/common/api";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";

// highlight text for every passed annotation on the active webpage
export async function anchorAnnotations(annotations: LindyAnnotation[]) {
    const body = document.body;

    const nodes: HTMLElement[] = [];
    await Promise.all(
        annotations.map(async (annotation) => {
            try {
                const range = await anchorHTML(body, annotation.quote_html_selector as any[]);
                if (!range) {
                    // e.g. selection removed?
                    return;
                }

                const highlightedNodes = highlightRange(
                    annotation.id,
                    range,
                    annotation.isMyAnnotation || annotation.platform === "info"
                        ? "lindy-highlight"
                        : "lindy-crowd-highlight"
                );
                if (highlightedNodes.length === 0) {
                    throw Error("Includes no highlighted nodes");
                }

                nodes.push(highlightedNodes[0]);
            } catch (err) {
                console.error(`Could not anchor annotation with id`, annotation.id);
            }
        })
    );

    const [offsetById, offsetEndById] = getHighlightOffsets(nodes);

    // insertMarginBar(anchoredAnnotations);

    return [offsetById, offsetEndById];
}

export function paintHighlight(
    annotation: LindyAnnotation,
    sidebarIframe: HTMLIFrameElement,
    highlightedNodes?: HTMLElement[]
) {
    if (!highlightedNodes) {
        highlightedNodes = getAnnotationNodes(annotation);
    }

    // set color variables
    const [annotationColor, darkerAnnotationColor] = getAnnotationColorNew(annotation);
    highlightedNodes.map((node) => {
        node.style.setProperty("--annotation-color", annotationColor, "important");
        node.style.setProperty("--darker-annotation-color", darkerAnnotationColor, "important");
    });

    // handle onclick
    highlightedNodes.map((node) => {
        node.onclick = () => {
            hoverUpdateHighlight(annotation, true);

            sendIframeEvent(sidebarIframe, {
                event: "focusAnnotation",
                annotationId: annotation.id,
            });

            // handle keyboard events for focused annotation
            // the focus is still on the main page, so can't handle events there
            // const keyboardListener = async (e: KeyboardEvent) => {
            //     if (e.key === "Escape") {
            //         hoverUpdateHighlight(annotation, false);
            //         sendIframeEvent(sidebarIframe, {
            //             event: "focusAnnotation",
            //             annotationId: null,
            //         });
            //         document.removeEventListener("keydown", keyboardListener);
            //     } else if (e.key === "Delete" || e.key === "Backspace") {
            //         const rep = new ReplicacheProxy();
            //         const userInfo = await rep?.query.getUserInfo();

            //         await rep.mutate.deleteAnnotation(annotation.id);
            //         if (userInfo?.aiEnabled) {
            //             deleteAnnotationVectors(userInfo.id, undefined, annotation.id);
            //         }
            //         reportEventContentScript("deleteAnnotation");

            //         document.removeEventListener("keydown", keyboardListener);
            //     }
            // };
            // document.addEventListener("keydown", keyboardListener);

            // unfocus on next click for social comments
            // for old annotation drafts this is handled without duplicate events by the textarea onBlur
            // const onNextClick = (event: Event) => {
            //     console.log("onNextClick", event.target);
            //     // @ts-ignore
            //     if (!event.target.classList.contains("lindy-highlight")) {
            //         hoverUpdateHighlight(annotation, false);
            //         sendIframeEvent(sidebarIframe, {
            //             event: "focusAnnotation",
            //             annotationId: null,
            //         });
            //     }
            //     document.removeEventListener("click", onNextClick, true);
            //     document.removeEventListener("keydown", keyboardListener);
            // };
            // document.addEventListener("click", onNextClick, true);
        };
    });

    return highlightedNodes;
}

export function insertMarginBar(
    anchoredAnnotations: LindyAnnotation[]
    // sidebarIframe: HTMLIFrameElement
) {
    document.getElementById("lindy-annotations-marginbar")?.remove();

    const container = document.createElement("div");
    container.className = overrideClassname;
    container.id = "lindy-annotations-marginbar";
    document.body.appendChild(container);

    const bodyOffset = getNodeOffset(document.body);
    anchoredAnnotations.map((annotation, index) => {
        if (!annotation.displayOffset) {
            return;
        }

        const barElement = document.createElement("div");
        barElement.style.top = `${annotation.displayOffset - bodyOffset}px`;

        // color
        // const annotationColor =
        //     annotation.platform === "hn" ? "rgba(255, 102, 0, 0.5)" : "rgba(189, 28, 43, 0.5)";
        // const darkerAnnotationColor = annotationColor.replace("0.5", "0.8");
        // barElement.style.setProperty(
        //     "--darker-annotation-color",
        //     darkerAnnotationColor,
        //     "important"
        // );

        // dot style
        // barElement.className = "lindy-marginbar-dot";

        // bar style
        // barElement.style.height = `${annotation.displayOffsetEnd - annotation.displayOffset}px`;
        // barElement.style.width = "8px";
        // barElement.style.background = "var(--darker-annotation-color)";

        // text style
        // barElement.innerText = `${Math.ceil(Math.random() * 5)}`;

        // icon style
        barElement.style.width = "18px";
        barElement.style.height = "18px";
        const svg = document.createElement("svg");
        // use inline SVG to fill with current color depending on color theme
        svg.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M512 288c0 35.35-21.49 64-48 64c-32.43 0-31.72-32-55.64-32C394.9 320 384 330.9 384 344.4V480c0 17.67-14.33 32-32 32h-71.64C266.9 512 256 501.1 256 487.6C256 463.1 288 464.4 288 432c0-26.51-28.65-48-64-48s-64 21.49-64 48c0 32.43 32 31.72 32 55.64C192 501.1 181.1 512 167.6 512H32c-17.67 0-32-14.33-32-32v-135.6C0 330.9 10.91 320 24.36 320C48.05 320 47.6 352 80 352C106.5 352 128 323.3 128 288S106.5 223.1 80 223.1c-32.43 0-31.72 32-55.64 32C10.91 255.1 0 245.1 0 231.6v-71.64c0-17.67 14.33-31.1 32-31.1h135.6C181.1 127.1 192 117.1 192 103.6c0-23.69-32-23.24-32-55.64c0-26.51 28.65-47.1 64-47.1s64 21.49 64 47.1c0 32.43-32 31.72-32 55.64c0 13.45 10.91 24.36 24.36 24.36H352c17.67 0 32 14.33 32 31.1v71.64c0 13.45 10.91 24.36 24.36 24.36c23.69 0 23.24-32 55.64-32C490.5 223.1 512 252.7 512 288z"/></svg>`;
        svg.style.marginTop = "1px";
        barElement.appendChild(svg);

        // barElement.onmouseenter = () => {
        //     hoverUpdateHighlight(annotation, true);

        //     sendIframeEvent(sidebarIframe, {
        //         event: "focusAnnotation",
        //         annotationId: annotation.id,
        //     });
        // };

        container.appendChild(barElement);
    });
}

// remove all text highlighting
export function removeAllHighlights() {
    removeAllHighlightsApi(document.body);
}

// a highlight may comprise multiple text nodes
export function getAnnotationNodes(annotation): HTMLElement[] {
    const nodeList = document.querySelectorAll(`lindy-highlight[id="${annotation.id}"]`);
    return [...nodeList] as HTMLElement[];
}

// remove a specific text highlighting
export function removeHighlight(annotation) {
    const nodes = getAnnotationNodes(annotation);
    removeHighlightsApi(nodes);
}

// get the Y position of all text highlighlights
export function getHighlightOffsets(highlightNodes: HTMLElement[]) {
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

export function hoverUpdateHighlight(annotation: LindyAnnotation, hoverActive: boolean) {
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
