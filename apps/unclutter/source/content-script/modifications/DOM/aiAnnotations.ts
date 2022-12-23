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
import { Annotation } from "@unclutter/library-components/dist/store";

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

    annotations: LindyAnnotation[] = [];
    async parseArticle() {
        const text = document.body.innerText.trim(); // TODO call DOM text extraction only once?
        const response: any = await ky
            .post("https://q5ie5hjr3g.execute-api.us-east-2.amazonaws.com/default/heatmap", {
                json: {
                    text,
                },
            })
            .json();
        const quotes = response.rankings
            .filter((r: any) => r.score > 0.7)
            .map((r: any) => r.sentence);

        // const quotes: string[] = await ky
        //     .post("https://assistant-two.vercel.app/api/annotations", {
        //         json: {
        //             text: text,
        //         },
        //         timeout: false,
        //     })
        //     .json();

        console.log("searching quotes", quotes);
        this.anchorQuotes(quotes);
        console.log("anchored quotes", this.annotations);

        // await this.linkRelatedHighlights();

        // TODO call from transitions?
        this.paintHighlights();
    }

    async paintHighlights() {
        // console.log("paintHighlights", this.annotations);
        this.annotations = await Promise.all(
            this.annotations.map((a) =>
                wrapPaintAnnotation(a, this.annotationsModifier.sidebarIframe)
            )
        );
        this.annotations = this.annotations.filter((a) => a !== null);

        // await new Promise((r) => setTimeout(r, 2000));
        this.annotationsModifier.setInfoAnnotations(this.annotations);
    }

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

    private async linkRelatedHighlights() {
        const paragraphNodes: { [text: string]: HTMLElement } = {};
        const paragraphs = [
            ...document.querySelectorAll(this.textContainerModifier.usedTextElementSelector),
        ]
            .map((node: HTMLElement) => {
                try {
                    if (node.offsetHeight === 0) {
                        return [];
                    }

                    let text = node.innerText.trim(); // inner text to include line breaks e.g. on paulgraham.com
                    if (!text || text.length < 50) {
                        return [];
                    }

                    if (text.length >= 500) {
                        const parts = text.split("\n\n").filter((t) => t && t.length >= 50);
                        parts.forEach((part) => {
                            paragraphNodes[part] = node;
                        });
                        return parts;
                    }

                    paragraphNodes[text] = node;
                    return [text];
                } catch (err) {
                    console.error(err);
                    return [];
                }
            })
            .flat();
        console.log("paragraphs", paragraphs);

        const relatedAnnotations: {
            anchor_text: string;
            annotations: LindyAnnotation[];
        }[] = await ky
            .post("https://assistant-two.vercel.app/api/related_highlights", {
                json: {
                    title: document.title,
                    paragraphs,
                },
                timeout: false,
            })
            .json();
        console.log("relatedAnnotations", relatedAnnotations);

        const anchoredAnnotations = relatedAnnotations
            .map((a) => {
                try {
                    const node = paragraphNodes[a.anchor_text];

                    const ranges = searchNodeTree(node, [a.anchor_text]);
                    return ranges.map((range) => ({
                        ...createInfoAnnotation(
                            window.location.href,
                            describeAnnotation(document.body, range),
                            undefined,
                            a.annotations
                        ),
                    }));
                } catch (err) {
                    console.error(err);
                }
            })
            .flat();
        console.log("anchoredAnnotations", anchoredAnnotations);
        this.annotations = anchoredAnnotations;
    }

    private async fetchRelated(node: HTMLElement, text: string): Promise<LindyAnnotation[]> {
        const related = await ky
            .post("https://assistant-two.vercel.app/api/query", {
                json: {
                    query: text.replace(/\s+/g, " ").trim(),
                },
            })
            .json()
            .then((related: any[]) =>
                related
                    .filter((r) => r.score >= 0.5 && r.metadata.text.length >= 50)
                    .sort((a, b) => b.score - a.score)
                    .map(
                        (r) =>
                            ({
                                id: r.id,
                                author: r.metadata.title,
                                text: `"${r.score.toString().slice(0, 4)} ${r.metadata.text
                                    .replace(/\\n/g, " ")
                                    .replace(/\s+/g, " ")}"`,
                            } as LindyAnnotation)
                    )
            );

        console.log(related, text.length, text);
        if (related.length > 0) {
            // TODO handle node split?
            const range = document.createRange();
            range.setStart(node, 0);
            range.setEnd(node, node.childNodes.length);

            this.annotations.push(
                createInfoAnnotation(
                    window.location.href,
                    describeAnnotation(document.body, range),
                    undefined,
                    related
                )
            );
        }
        return related;
    }
}

export function searchNodeTree(root: HTMLElement, quotes: string[]): Range[] {
    let ranges: Range[] = [];

    function searchParentNodeDfs(node: HTMLElement) {
        // test if entire text of chilren includes search string
        // match text against spaces (does not matter for offset)
        let text = node.textContent.toLowerCase();
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

        // console.log(node);

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
                // console.log("anchored quote");
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
