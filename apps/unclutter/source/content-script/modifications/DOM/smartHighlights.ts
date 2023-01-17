import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import browser from "../../../common/polyfill";
import { createAnnotation, LindyAnnotation } from "../../../common/annotations/create";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import { PageModifier, trackModifierExecution } from "../_interface";
import { sendIframeEvent } from "../../../common/reactIframe";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import {
    fetchRelatedAnnotations,
    indexAnnotationVectors,
    RelatedHighlight,
} from "@unclutter/library-components/dist/common/api";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import { Annotation } from "@unclutter/library-components/dist/store";

export interface RankedSentence {
    id: string;
    score: number;
    sentence: string;
    related?: RelatedHighlight[];
}

// analyse an article page and highlight key sentences using an in-browser AI model
@trackModifierExecution
export default class SmartHighlightsModifier implements PageModifier {
    private user_id: string;
    private article_id: string;

    annotations: Annotation[];
    annotationsCount: number | null;
    relatedCount: number | null;

    private scoreThreshold = 0.6;
    private relatedThreshold = 0.4;

    constructor(user_id: string) {
        this.user_id = user_id;
        this.article_id = getUrlHash(window.location.href);

        window.addEventListener("message", (event) => this.handleMessage(event.data || {}));
    }

    private generatedAnnotations: boolean = false;
    async fetchAnnotations(): Promise<boolean> {
        // fetch existing user annotations locally
        const rep = new ReplicacheProxy();
        this.annotations = await rep.query.listArticleAnnotations(this.article_id);
        console.log(`Found ${this.annotations.length} local annotations for article`);

        // if no ai annotations saved, create them
        const aiAnnotations = this.annotations.filter((a) => a.ai_created);
        if (aiAnnotations.length === 0) {
            const newAnnotations = await this.parseAnnotationsFromArticle();
            this.annotations.push(...newAnnotations);
            this.generatedAnnotations = true;
        }

        // likely not an article if no annotations present or generated
        this.annotationsCount = this.annotations.length;
        if (this.annotations.length === 0) {
            return false;
        }

        if (this.saveOnGenerated) {
            this.saveAnnotations();
        }

        return true;
    }

    async parseAnnotationsFromArticle(): Promise<Annotation[]> {
        console.log(`Generating AI highlights for article...`);
        let start = performance.now();

        // parse DOM and extract significant text elements
        const [paragraphsElements, paragraphTexts] = this.listParagraphs();
        if (paragraphTexts.length === 0 || paragraphTexts.length >= 200) {
            // likely not an article
            // be careful, e.g. paulgraham.com has single paragraph
            return [];
        }

        // run AI model on article text in extension background worker (no data is sent over the network)
        let rankedSentencesByParagraph: RankedSentence[][] | undefined;
        try {
            rankedSentencesByParagraph = await browser.runtime.sendMessage(null, {
                event: "getHeatmap",
                paragraphs: paragraphTexts,
            });
        } catch {
            return [];
        }

        // create annotations for significant detected quotes
        const newAnnotations = this.createAnnotations(
            paragraphsElements,
            rankedSentencesByParagraph
        );

        // report diagnostics
        let durationMs = Math.round(performance.now() - start);
        reportEventContentScript("renderHighlightsLayer", {
            paragraphCount: paragraphsElements.length,
            annotationsCount: this.annotationsCount,
            relatedCount: this.relatedCount,
            durationMs,
        });

        return newAnnotations;
    }

    private listParagraphs(): [HTMLElement[], string[]] {
        const paragraphsElements: HTMLElement[] = [];
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

            paragraphsElements.push(paragraph);
            // use raw text content to anchor sentences correctly later
            paragraphTexts.push(rawText);
        });

        return [paragraphsElements, paragraphTexts];
    }

    private createAnnotations(
        paragraphElements: HTMLElement[],
        rankedSentencesByParagraph: RankedSentence[][]
    ): Annotation[] {
        const annotations: Annotation[] = [];

        const created_at = Math.round(new Date().getTime() / 1000);

        let runningCount = 0;
        paragraphElements.forEach((paragraph, index) => {
            const rankedSentences = rankedSentencesByParagraph?.[index];
            if (!rankedSentences) {
                return;
            }

            // anchor all sentences to use correct offsets
            let ranges = this.anchorParagraphSentences(
                paragraph,
                rankedSentences.map((s) => s.sentence)
            );

            // construct global annotationState
            ranges.forEach((range, i) => {
                const sentence = rankedSentences[i];

                // filter to only important sentences
                if (sentence.score < this.scoreThreshold) {
                    return;
                }

                annotations.push({
                    id: `ai_${this.article_id.slice(0, 20)}_${runningCount}`,
                    article_id: this.article_id,
                    quote_text: sentence.sentence,
                    created_at,
                    quote_html_selector: describeAnnotation(document.body, range),
                    ai_created: true,
                    ai_score: sentence.score,
                });
                runningCount++;
            });
        });

        return annotations;
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

    private relatedPerAnnotation: RelatedHighlight[][];
    async fetchRelated(): Promise<void> {
        if (!this.annotations || this.annotations.length === 0) {
            return;
        }

        // fetch user highlights that are related to the found article annotations
        const relatedPerAnnotation = await fetchRelatedAnnotations(
            this.user_id,
            this.article_id,
            this.annotations.map((a) => a.quote_text),
            this.relatedThreshold,
            false
        );

        const rep = new ReplicacheProxy();

        // add to rankedSentencesByParagraph
        this.relatedCount = 0;
        await Promise.all(
            relatedPerAnnotation.map(async (related, i) => {
                // filter related now
                related = related.slice(0, 2).filter((r) => r.score2 >= this.relatedThreshold);
                if (related.length === 0) {
                    relatedPerAnnotation[i] = [];
                    return;
                }

                // fetch article info from local user library
                await Promise.all(
                    related.map(async (related) => {
                        related.article = await rep.query.getArticle(related.article_id);
                    })
                );

                this.relatedCount += related.length;
                relatedPerAnnotation[i] = related;
            })
        );

        // send to sidebar if already ready
        this.relatedPerAnnotation = relatedPerAnnotation;
        this.sendAnnotationsToSidebar();
    }

    private handleMessage(message: any) {
        if (message.type === "sendAIAnnotationsToSidebar") {
            // event sent from AnnotationsModifier once sidebar is ready

            // reply with annotations (only if related done)
            if (this.relatedPerAnnotation) {
                this.sendAnnotationsToSidebar();
            }
        }
    }

    private sendAnnotationsToSidebar() {
        const sidebarIframe = document.getElementById("lindy-annotations-bar") as HTMLIFrameElement;
        if (sidebarIframe && this.annotations.length > 0) {
            sendIframeEvent(sidebarIframe, {
                event: "setAIAnnotations",
                annotations: this.annotations,
                relatedPerAnnotation: this.relatedPerAnnotation,
            });
        }
    }

    private saveOnGenerated = false;
    async saveAnnotations() {
        if (!this.generatedAnnotations) {
            this.saveOnGenerated = true;
            return;
        }

        const aiAnnotations = this.annotations?.filter((a) => a.ai_created);
        if (!aiAnnotations || aiAnnotations.length === 0) {
            return;
        }
        console.log(`Saving ${aiAnnotations.length} AI highlights...`);

        // save locally
        const rep = new ReplicacheProxy();
        await Promise.all(
            aiAnnotations.map(async (annotation) => rep.mutate.putAnnotation(annotation))
        );

        // save embeddings
        await indexAnnotationVectors(
            this.user_id,
            this.article_id,
            aiAnnotations.map((a) => a.quote_text),
            undefined,
            true
        );
    }
}

const excludedParagraphClassNames = [
    "comment", // https://civilservice.blog.gov.uk/2022/08/16/a-simple-guide-on-words-to-avoid-in-government/
    "reference", // https://en.wikipedia.org/wiki/Sunstone_(medieval)
];
