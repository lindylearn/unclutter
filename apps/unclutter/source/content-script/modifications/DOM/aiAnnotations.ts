import ky from "ky";
import { PageModifier, trackModifierExecution } from "../_interface";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import { createInfoAnnotation, LindyAnnotation } from "../../../common/annotations/create";
import { getNodeOffset } from "../../../common/annotations/offset";
import AnnotationsModifier from "../annotations/annotationsModifier";
import { wrapPaintAnnotation } from "../annotations/selectionListener";
import { highlightRange } from "../../../common/annotator/highlighter";
import { paintHighlight } from "../annotations/highlightsApi";
import TextContainerModifier from "./textContainer";

@trackModifierExecution
export default class AIAnnotationsModifier implements PageModifier {
    private annotationsModifier: AnnotationsModifier;
    private textContainerModifier: TextContainerModifier;

    constructor(
        annotationsModifier: AnnotationsModifier,
        textContainerModifier: TextContainerModifier
    ) {
        this.annotationsModifier = annotationsModifier;
        this.textContainerModifier = textContainerModifier;
    }

    async parseArticle() {
        // TODO call only once?
        const text = document.body.innerText.trim();

        const quotes: string[] = await ky
            .post("https://assistant-two.vercel.app/api/annotations", {
                json: {
                    text: text,
                },
                timeout: false,
            })
            .json();
        // const quotes = [
        // ];
        console.log("searching quotes", quotes);

        this.anchorQuotes(quotes);
        console.log("anchored quotes", this.annotations);

        // TODO call from transitions?
        this.paintHighlights();
    }

    async paintHighlights() {
        console.log("paintHighlights", this.annotations);
        this.annotations = await Promise.all(
            this.annotations.map((a) =>
                wrapPaintAnnotation(a, this.annotationsModifier.sidebarIframe)
            )
        );

        // await new Promise((r) => setTimeout(r, 2000));
        this.annotationsModifier.setInfoAnnotations(this.annotations);
    }

    annotations: LindyAnnotation[] = [];
    private anchorQuotes(questions: string[]) {
        document
            .querySelectorAll(this.textContainerModifier.usedTextElementSelector)
            .forEach((node: HTMLElement) => {
                try {
                    const ranges = searchNodeTree(node, questions);
                    ranges.forEach((range) => {
                        this.annotations.push(
                            createInfoAnnotation(
                                window.location.href,
                                describeAnnotation(document.body, range)
                            )
                        );
                    });
                } catch (err) {
                    console.error(err);
                }
            });
    }
}

function searchNodeTree(root: HTMLElement, quotes: string[]): Range[] {
    let ranges: Range[] = [];

    function searchParentNodeDfs(node: HTMLElement) {
        // test if entire text of chilren includes search string
        // match text against spaces (does not matter for offset)
        let text = node.textContent?.replace(/\s+/g, " ").trim().toLowerCase();
        if (!text) {
            return false;
        }

        // TODO handle quotes seperately?
        const quote = quotes.find((q) => text.includes(q.toLowerCase()));
        if (!quote) {
            return false;
        }
        const start = text.indexOf(quote.toLowerCase());
        const end = start + quote.length;

        console.log(node);

        // check deepest node that containes the entire quote
        const isDeepestNodeMatch = [...node.childNodes]
            .map((child) => searchParentNodeDfs(child as HTMLElement))
            .every((x) => !x);

        if (isDeepestNodeMatch) {
            let startNode = null;
            let endNode = null;
            let startNodeOffset = null;
            let endNodeOffset = null;

            // loop children
            // attribute start and end points to partial children
            const textNodes = getNodesTextDfs(node);
            let runningLength = 0;
            for (node of textNodes) {
                const textLength = node.textContent.length;
                if (start >= runningLength && start < runningLength + textLength) {
                    startNode = node;
                    startNodeOffset = start - runningLength;
                }
                if (end > runningLength && end <= runningLength + textLength) {
                    endNode = node;
                    endNodeOffset = end - runningLength;
                }

                runningLength += textLength;
            }

            if (startNode && endNode) {
                console.log("anchored quote");
                const range = document.createRange();
                range.setStart(startNode, startNodeOffset);
                range.setEnd(endNode, endNodeOffset);
                ranges.push(range);
            }
        }

        return true;
    }

    function getNodesTextDfs(node) {
        if (node.nodeType == Node.TEXT_NODE) {
            return [node];
        }
        return [...node.childNodes].map((child) => getNodesTextDfs(child)).flat();
    }

    searchParentNodeDfs(root);

    return ranges;
}
