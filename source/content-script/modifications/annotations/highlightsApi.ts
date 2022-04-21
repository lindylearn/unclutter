import { getNodeOffset } from "../../../common/annotations/offset";
import { getAnnotationColor } from "../../../common/annotations/styling";
import { anchor as anchorHTML } from "../../../common/annotator/anchoring/html";
import {
    highlightRange,
    removeAllHighlights as removeAllHighlightsApi,
    removeHighlights as removeHighlightsApi,
} from "../../../common/annotator/highlighter";
import { overrideClassname } from "../../../common/stylesheets";

// highlight text for every passed annotation on the active webpage
export async function highlightAnnotations(annotations) {
    const body = document.body;

    const anchoredAnnotations = [];
    await Promise.all(
        annotations.map(async (annotation) => {
            try {
                const range = await anchorHTML(
                    body,
                    annotation.quote_html_selector
                );
                if (!range) {
                    // e.g. selection removed?
                    return;
                }

                const highlightedNodes = highlightRange(annotation.id, range);
                if (!highlightedNodes) {
                    throw Error("includes no highlighted nodes");
                }

                const displayOffset = getNodeOffset(highlightedNodes[0]);
                const displayOffsetEnd = getNodeOffset(
                    highlightedNodes[highlightedNodes.length - 1],
                    "bottom"
                );

                if (annotation.isMyAnnotation) {
                    paintHighlight(annotation, getAnnotationColor(annotation));
                }

                anchoredAnnotations.push({
                    ...annotation,
                    displayOffset,
                    displayOffsetEnd,
                });
            } catch (err) {
                console.error(`Could not anchor annotation:`, annotation, err);
            }
        })
    );

    // insertMarginBar(anchoredAnnotations)

    return anchoredAnnotations;
}

function insertMarginBar(anchoredAnnotations) {
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

        barElement.style.top = `${annotation.displayOffset - bodyOffset}px`;
        barElement.style.height = `${
            annotation.displayOffsetEnd - annotation.displayOffset
        }px`;

        // barElement.innerText = annotation.reply_count || 1;
        barElement.style.paddingRight = "5px";
        barElement.style.color = "#9ca3af";
        barElement.style.fontWeight = "700";
        barElement.style.backgroundColor = "#ffb380"; // getAnnotationColor(annotation);

        // barElement.innerHTML = `<svg style="width: 20px" viewBox="0 0 512 512">
        //     <path
        //         fill="currentColor"
        //         d="M256 32C114.6 32 .0272 125.1 .0272 240c0 47.63 19.91 91.25 52.91 126.2c-14.88 39.5-45.87 72.88-46.37 73.25c-6.625 7-8.375 17.25-4.625 26C5.818 474.2 14.38 480 24 480c61.5 0 109.1-25.75 139.1-46.25C191.1 442.8 223.3 448 256 448c141.4 0 255.1-93.13 255.1-208S397.4 32 256 32zM256.1 400c-26.75 0-53.12-4.125-78.38-12.12l-22.75-7.125l-19.5 13.75c-14.25 10.12-33.88 21.38-57.5 29c7.375-12.12 14.37-25.75 19.88-40.25l10.62-28l-20.62-21.87C69.82 314.1 48.07 282.2 48.07 240c0-88.25 93.25-160 208-160s208 71.75 208 160S370.8 400 256.1 400z"
        //     />
        // </svg>`;

        container.appendChild(barElement);
    });
}

// remove all text highlighting
export function removeAllHighlights() {
    removeAllHighlightsApi(document.body);
}

function getAnnotationNodes(annotation): HTMLElement[] {
    const nodeList = document.querySelectorAll(
        `lindy-highlight[id="${annotation.localId || annotation.id}"]`
    );
    return [...nodeList] as HTMLElement[];
}

// remove a specific text highlighting
export function removeHighlight(annotation) {
    const nodes = getAnnotationNodes(annotation);
    removeHighlightsApi(nodes);
}

// get the Y position of all text highlighlights
export function getHighlightOffsets() {
    const body = document.body;

    const highlightNodes = [...body.querySelectorAll(".lindy-highlight")];

    // highlight may include multiple nodes across html tags
    // so iterate nodes in sequence and only take the first offset
    const offsetById = {};
    for (const node of highlightNodes) {
        if (offsetById[node.id]) {
            continue;
        }
        const displayOffset = getNodeOffset(node);
        offsetById[node.id] = displayOffset;
    }

    return offsetById;
}

export function paintHighlight(annotation, color: string) {
    const nodes = getAnnotationNodes(annotation);
    nodes.map((node) => {
        node.style.transition = "background 0.15s linear";
        node.style.backgroundColor = color;
    });
}
export function unPaintHighlight(annotation) {
    paintHighlight(annotation, "transparent");
}
