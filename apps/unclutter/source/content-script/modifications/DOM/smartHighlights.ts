import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import browser from "../../../common/polyfill";
import { createAnnotation, LindyAnnotation } from "../../../common/annotations/create";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import { PageModifier, trackModifierExecution } from "../_interface";
import { getNodeOffset } from "../../../common/annotations/offset";
import { sendIframeEvent } from "../../../common/reactIframe";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import {
    fetchRelatedAnnotations,
    indexAnnotationVectors,
    RelatedHighlight,
} from "@unclutter/library-components/dist/common/api";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";

export interface RankedSentence {
    id: string;
    score: number;
    sentence: string;
    related?: RelatedHighlight[];
}

const excludedParagraphClassNames = [
    "comment", // https://civilservice.blog.gov.uk/2022/08/16/a-simple-guide-on-words-to-avoid-in-government/
    "reference", // https://en.wikipedia.org/wiki/Sunstone_(medieval)
];

// analyse an article page and highlight key sentences using AI
@trackModifierExecution
export default class SmartHighlightsModifier implements PageModifier {
    private user_id: string;
    private article_id: string;

    keyPointsCount: number | null = null;
    relatedCount: number | null = null;
    topHighlights: {
        highlight: string;
        paragraphIndex: number;
        sentenceIndex: number;
    }[] = [];

    private scoreThreshold = 0.6;
    private relatedThreshold = 0.4;

    constructor(user_id: string) {
        this.user_id = user_id;
        this.article_id = getUrlHash(window.location.href);

        window.addEventListener("message", (event) => this.handleMessage(event.data || {}));
    }

    private handleMessage(message: any) {
        if (message.type === "sendSmartHighlightsToSidebar") {
            // sent from AnnotationsModifier once sidebar is ready
            this.sendSidebarMessages();
        }
    }

    private sendSidebarMessages() {
        const sidebarIframe = document.getElementById("lindy-annotations-bar") as HTMLIFrameElement;
        if (sidebarIframe && this.annotations.length > 0) {
            sendIframeEvent(sidebarIframe, {
                event: "setInfoAnnotations",
                annotations: this.annotations,
            });
            sendIframeEvent(sidebarIframe, {
                event: "changedDisplayOffset",
                offsetById: this.offsetById,
                offsetEndById: this.offsetEndById,
            });
        }
    }

    annotations: LindyAnnotation[] = [];

    private paragraphs: HTMLElement[] = [];
    private rankedSentencesByParagraph: RankedSentence[][];
    async parseUnclutteredArticle(): Promise<boolean> {
        let start = performance.now();

        // parse article paragraphs from page
        const paragraphTexts: string[] = [];
        document.querySelectorAll("p, font, li").forEach((paragraph: HTMLElement) => {
            // Ignore invisible nodes
            if (paragraph.offsetHeight === 0) {
                return false;
            }

            // check text content (textContent to anchor range correctly)
            const rawText = paragraph.textContent;
            const cleanText = rawText?.replace(/[\s\n]+/g, " ").trim();
            if (!rawText || cleanText.length < 200) {
                return;
            }

            // check classes
            if (
                excludedParagraphClassNames.some((word) =>
                    paragraph.className.toLowerCase().includes(word)
                ) ||
                excludedParagraphClassNames.some((word) =>
                    paragraph.parentElement?.className.toLowerCase().includes(word)
                ) ||
                excludedParagraphClassNames.some((word) =>
                    paragraph.parentElement?.parentElement?.className.toLowerCase().includes(word)
                )
            ) {
                return;
            }
            if (paragraph.tagName === "CODE" || paragraph.parentElement.tagName === "CODE") {
                return;
            }

            this.paragraphs.push(paragraph);
            // use raw text content to anchor sentences correctly later
            paragraphTexts.push(rawText);
        });

        if (paragraphTexts.length === 0 || paragraphTexts.length >= 200) {
            // likely not an article
            // be careful, e.g. paulgraham.com has single paragraph
            this.keyPointsCount = 0;
            return false;
        }

        // construct sentence heatmap in extension background worker (with no data sent over the network)
        try {
            this.rankedSentencesByParagraph = await browser.runtime.sendMessage(null, {
                event: "getHeatmap",
                paragraphs: paragraphTexts,
            });
        } catch {
            this.keyPointsCount = 0;
            return false;
        }
        // console.log(this.rankedSentencesByParagraph);

        // paint highlights immediately once heatmap ready
        // this.enableAnnotations();
        this.anchorSentences();

        // parse heatmap stats and most important sentences
        this.keyPointsCount = 0;
        this.rankedSentencesByParagraph?.forEach((paragraph, paragraphIndex) => {
            paragraph.forEach((sentence: RankedSentence, sentenceIndex) => {
                if (sentence.score >= this.scoreThreshold) {
                    this.keyPointsCount += 1;
                    this.topHighlights.push({
                        highlight: sentence.sentence,
                        paragraphIndex,
                        sentenceIndex,
                    });
                }
            });
        });
        // console.log(this.topHighlights.map((s) => s.highlight?.replace(/[\s\n]+/g, " ").trim()));

        // insert smart highlights into the remote vector database, if enabled by the user
        // only the text highlighted in yellow on article pages is sent over the network,
        // using only the one-way hash of the current URL for deduplication
        // indexAnnotationVectors(
        //     this.user_id,
        //     this.article_id,
        //     this.topHighlights.map((h) => h.highlight),
        //     undefined,
        //     true
        // );

        // report diagnostics
        let durationMs = Math.round(performance.now() - start);
        reportEventContentScript("renderHighlightsLayer", {
            paragraphCount: this.paragraphs.length,
            keyPointsCount: this.keyPointsCount,
            relatedCount: this.relatedCount,
            durationMs,
        });

        return true;
    }

    async fetchRelatedHighlights(): Promise<void> {
        // fetch related existing highlights
        const relatedPerHighlight = await fetchRelatedAnnotations(
            this.user_id,
            this.article_id,
            this.topHighlights.map((s) => s.highlight),
            this.relatedThreshold,
            true // save passed highlights to the user database
        );

        const rep = new ReplicacheProxy();

        // add to rankedSentencesByParagraph
        this.relatedCount = 0;
        await Promise.all(
            relatedPerHighlight.map(async (related, highlightIndex) => {
                // filter related now
                related = related.slice(0, 2).filter((r) => r.score2 >= this.relatedThreshold);
                if (related.length === 0) {
                    return;
                }

                // fetch article info from local user library
                await Promise.all(
                    related.map(async (related) => {
                        related.article = await rep.query.getArticle(related.article_id);
                    })
                );

                this.relatedCount += related.length;
                const { paragraphIndex, sentenceIndex } = this.topHighlights[highlightIndex];
                this.rankedSentencesByParagraph[paragraphIndex][sentenceIndex].related = related;
            })
        );
        if (this.relatedCount === 0) {
            return;
        }

        // paint again including related data
        this.createInfoAnnotations();
    }

    // populate this.annotationState based on this.rankedSentencesByParagraph
    private annotationState: {
        sentence: RankedSentence;
        container: HTMLElement;
        range: Range;
        paintedElements?: HTMLElement[];
        invalid?: boolean;
    }[] = [];
    private anchorSentences() {
        this.annotationState = [];

        this.paragraphs.forEach((paragraph, index) => {
            const rankedSentences = this.rankedSentencesByParagraph?.[index];
            if (!rankedSentences) {
                return;
            }

            // consider related anchors independently
            const textFragments: RankedSentence[] = [];
            rankedSentences.forEach((sentence, index) => {
                textFragments.push(sentence);
            });

            const container = this.getParagraphAnchor(paragraph);

            // anchor all sentences returned from backend
            let ranges = this.anchorParagraphSentences(
                paragraph,
                textFragments.map((s) => s.sentence)
            );

            // construct global annotationState
            ranges.forEach((range, i) => {
                const sentence = textFragments[i];

                // TODO save all sentences for enableAllAnnotations?
                if (!sentence.related && sentence.score < this.scoreThreshold) {
                    return;
                }

                this.annotationState.push({
                    sentence,
                    container,
                    range,
                });
            });
        });
    }

    // save last offsets to send to sidebar once requested
    private offsetById: { [id: string]: number } = {};
    private offsetEndById: { [id: string]: number } = {};
    private createInfoAnnotations() {
        this.annotations = [];

        this.annotationState.forEach(({ sentence, range }) => {
            if (sentence.related) {
                sentence.related.forEach((r, i) => {
                    this.annotations.push(
                        createAnnotation(
                            this.article_id,
                            describeAnnotation(document.body, range),
                            {
                                ...r,
                                id: `${sentence.id}_${i}`,
                                platform: "info",
                                infoType: "related",
                                // score: sentence.related[0].score + 0.2, // same score for all related
                            }
                        )
                    );
                });
            }
        });

        // send constructed annotations to sidebar if present
        this.sendSidebarMessages();
    }

    private getParagraphAnchor(container: HTMLElement) {
        // get container to anchor highlight elements

        // need to be able to anchor absolute elements
        while (container.nodeType !== Node.ELEMENT_NODE) {
            container = container.parentElement;
        }

        // box is not correct for inline elements
        let containerStyle = window.getComputedStyle(container);
        while (containerStyle.display === "inline") {
            container = container.parentElement;
            containerStyle = window.getComputedStyle(container);
        }

        // be careful with style changes
        if (containerStyle.position === "static") {
            container.style.setProperty("position", "relative", "important");
        }
        container.style.setProperty("z-index", "0", "important");

        return container;
    }

    // create ranges for each sentence by iterating leaf children
    private anchorParagraphSentences(paragraph: HTMLElement, sentences: string[]): Range[] {
        const ranges: Range[] = [];

        let currentElem: HTMLElement = paragraph;
        let runningTextLength = 0;
        let currentRange = document.createRange();
        currentRange.setStart(currentElem, 0);

        // console.log(paragraph.textContent, sentences);

        while (ranges.length < sentences.length) {
            // console.log(currentElem);
            if (!currentElem) {
                break;
            }

            const currentSentence = sentences[ranges.length];
            let currentSentenceLength = currentSentence.length;
            const currentLength = currentElem.textContent.length;

            // assume trailing space removed in backend
            // TODO handle this better
            let hasTrailingSpace = currentSentence.endsWith(" ");
            if (!hasTrailingSpace && ranges.length < sentences.length - 1) {
                // add space if middle sentence
                hasTrailingSpace = true;
                currentSentenceLength += 1;
            }

            if (runningTextLength + currentLength < currentSentenceLength) {
                // not enough text, skip entire node subtree
                // console.log("skip", runningTextLength, currentLength, currentSentenceLength);
                runningTextLength += currentLength;

                // get next sibling of closest parent
                // e.g. not direct parent on https://hardpivot.substack.com/p/why-we-stopped-working-on-athens
                let nextElem: HTMLElement;
                while (paragraph.contains(currentElem)) {
                    if (currentElem.nextSibling) {
                        nextElem = currentElem.nextSibling as HTMLElement;
                        break;
                    }
                    currentElem = currentElem.parentElement as HTMLElement;
                }

                if (nextElem) {
                    currentElem = nextElem;
                } else {
                    // end of paragraph (likely count error)
                    // console.log("break", currentElem);

                    // TODO parent not defined, e.g. on https://www.theatlantic.com/ideas/archive/2022/12/volodymyr-zelensky-visit-ukraine-united-states/672528/
                    currentRange.setEndAfter(paragraph);

                    ranges.push(currentRange);
                    break;
                }
            } else {
                if (currentElem.childNodes.length > 0) {
                    // iterate children
                    // console.log("iterate children");
                    currentElem = currentElem.childNodes[0] as HTMLElement;
                    continue;
                } else {
                    // slice text content
                    // console.log("slice", runningTextLength, currentLength, currentSentenceLength);

                    // sentence ends inside this node
                    const offset = currentSentenceLength - runningTextLength;
                    currentRange.setEnd(currentElem, offset - (hasTrailingSpace ? 1 : 0));
                    ranges.push(currentRange);
                    // console.log(currentRange.toString());

                    // start new range
                    currentRange = document.createRange();
                    currentRange.setStart(currentElem, offset);
                    runningTextLength = -offset; // handle in next iteration

                    // console.log("---");
                }
            }
        }
        // console.log(ranges.map((r) => r.toString()));

        return ranges;
    }
}
