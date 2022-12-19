import ky from "ky";
import { PageModifier, trackModifierExecution } from "../_interface";
import { generateId, LindyAnnotation } from "../../../common/annotations/create";
import AnnotationsModifier from "../annotations/annotationsModifier";
import { _createAnnotationFromSelection } from "../annotations/selectionListener";
import TextContainerModifier from "./textContainer";
import { splitSentences } from "@unclutter/library-components/dist/common";
import { sendIframeEvent } from "../../../common/reactIframe";
import {
    enableAnnotationsFeatureFlag,
    enableExperimentalFeatures,
    getFeatureFlag,
} from "../../../common/featureFlags";
import { removeAllHighlights } from "../annotations/highlightsApi";

@trackModifierExecution
export default class SmartHighlightsModifier implements PageModifier {
    private annotationsModifier: AnnotationsModifier;
    private textContainerModifier: TextContainerModifier;

    constructor(
        annotationsModifier: AnnotationsModifier,
        textContainerModifier: TextContainerModifier
    ) {
        this.annotationsModifier = annotationsModifier;
        this.textContainerModifier = textContainerModifier;
    }

    private paragraphs: HTMLElement[] = [];
    private rankedSentencesByParagraph: { score: number; sentence: string }[][];
    async parseArticle() {
        const annotationsEnabled = await getFeatureFlag(enableAnnotationsFeatureFlag);
        const experimentsEnabled = await getFeatureFlag(enableExperimentalFeatures);
        if (!annotationsEnabled || !experimentsEnabled) {
            return;
        }

        const paragraphTexts: string[] = [];
        document
            .querySelectorAll(this.textContainerModifier.usedTextElementSelector)
            .forEach((paragraph: HTMLElement) => {
                const textContent = paragraph.textContent;
                if (!textContent || textContent.length < 100) {
                    return;
                }
                this.paragraphs.push(paragraph);
                paragraphTexts.push(textContent);
            });

        this.rankedSentencesByParagraph = await ky
            .post("https://q5ie5hjr3g.execute-api.us-east-2.amazonaws.com/default/heatmap", {
                json: {
                    paragraphs: paragraphTexts,
                },
            })
            .json();

        this.enableAnnotations();
    }

    annotations: LindyAnnotation[] = [];
    enableAnnotations() {
        this.paragraphs.forEach((paragraph, index) => {
            const rankedSentences = this.rankedSentencesByParagraph?.[index];
            if (!rankedSentences) {
                return;
            }

            const ranges = this.anchorParagraphSentences(
                paragraph,
                rankedSentences.map((s) => s.sentence)
            );
            this.paintRanges(
                ranges,
                rankedSentences.map((s) => s.score)
            );
        });
    }

    private disableAnnotations() {
        removeAllHighlights();
    }

    setEnableAnnotations(enableAnnotations: boolean) {
        if (enableAnnotations) {
            this.enableAnnotations();
        } else {
            this.disableAnnotations();
        }
    }

    // private async splitSentences() {
    //     document
    //         .querySelectorAll(this.textContainerModifier.usedTextElementSelector)
    //         .forEach((paragraph: HTMLElement) => {
    //             try {
    //                 const textContent = paragraph.textContent;
    //                 if (!textContent) {
    //                     return;
    //                 }

    //                 // console.log("#####");
    //                 // console.log(paragraph);
    //                 let sentences = splitSentences(textContent);
    //                 // console.log(sentences);

    //                 // combine small sentences
    //                 const combinedSentences: string[] = [sentences[0]];
    //                 sentences.slice(1).forEach((sentence, index) => {
    //                     const lastSentence = combinedSentences.pop();

    //                     if (lastSentence.length < 100) {
    //                         combinedSentences.push(lastSentence + sentence);
    //                     } else {
    //                         combinedSentences.push(lastSentence);
    //                         combinedSentences.push(sentence);
    //                     }
    //                 });
    //                 sentences = combinedSentences;
    //                 // console.log(sentences);

    //                 const ranges = this.anchorParagraphSentences(paragraph, sentences);
    //                 this.paintRanges(ranges);
    //             } catch (err) {
    //                 console.error(err);
    //             }
    //         });
    // }

    // create ranges for each sentence by iterating leaf children
    private anchorParagraphSentences(paragraph: HTMLElement, sentences: string[]): Range[] {
        const ranges: Range[] = [];

        let currentElem: HTMLElement = paragraph;
        let runningTextLength = 0;
        let currentRange = document.createRange();
        currentRange.setStart(currentElem, 0);

        // console.log(paragraph, sentences);

        while (ranges.length < sentences.length) {
            if (!currentElem) {
                break;
            }

            const currentSentence = sentences[ranges.length];
            const currentLength = currentElem.textContent.length;

            // console.log({ currentElem });

            if (runningTextLength + currentLength < currentSentence.length) {
                // console.log(
                //     "skip",
                //     runningTextLength,
                //     currentLength,
                //     currentSentence.length
                // );
                // not enough text, skip entire node subtree
                runningTextLength += currentLength;
                if (currentElem.nextSibling) {
                    // next sibling
                    currentElem = currentElem.nextSibling as HTMLElement;
                } else if (!paragraph.contains(currentElem.parentElement.nextSibling)) {
                    // end of paragraph (likely count error)
                    // console.log("break");

                    currentRange.setEndAfter(paragraph);
                    // ranges.push(currentRange);
                    // console.log(currentRange.toString());
                    break;
                } else {
                    // next parent sibling
                    currentElem = currentElem.parentElement.nextSibling as HTMLElement;
                }
            } else {
                if (currentElem.childNodes.length > 0) {
                    // iterate children
                    // console.log("iterate children");
                    currentElem = currentElem.childNodes[0] as HTMLElement;
                    continue;
                } else {
                    // slice text content
                    // console.log(
                    //     "slice",
                    //     runningTextLength,
                    //     currentLength,
                    //     currentSentence.length
                    // );

                    // sentence ends inside this node
                    const offset = currentSentence.length - runningTextLength;
                    currentRange.setEnd(currentElem, offset);
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

        return ranges;
    }

    private backgroundContainer: HTMLElement;
    private clickContainer: HTMLElement;
    createContainer() {
        this.backgroundContainer = document.createElement("div");
        this.backgroundContainer.className = "lindy-smart-highlight-container";
        this.backgroundContainer.style.setProperty("z-index", "999");
        document.body.prepend(this.backgroundContainer);

        this.clickContainer = document.createElement("div");
        this.clickContainer.className = "lindy-smart-highlight-container";
        this.backgroundContainer.style.setProperty("z-index", "1001");
        document.body.append(this.clickContainer);
    }

    private paintRanges(ranges: Range[], scores?: number[]) {
        const containerRect = this.backgroundContainer.getBoundingClientRect();
        ranges.map((range, i) => {
            if (range.toString().trim().length < 10) {
                return;
            }
            const score = scores?.[i];
            if (score < 0.6) {
                return;
            }

            let lastRect: ClientRect;
            for (const rect of range.getClientRects()) {
                // check overlap
                if (
                    lastRect &&
                    !(
                        lastRect.top >= rect.bottom ||
                        lastRect.right <= rect.left ||
                        lastRect.bottom <= rect.top ||
                        lastRect.left >= rect.right
                    )
                ) {
                    continue;
                }
                lastRect = rect;

                const node = document.createElement("div");
                node.className = "lindy-smart-highlight-absolute";
                node.style.setProperty(
                    "background",
                    `rgba(250, 204, 21, ${score >= 0.6 ? 0.5 * score ** 3 : 0})`,
                    "important"
                );
                node.style.setProperty("position", "absolute", "important");
                node.style.setProperty("top", `${rect.top - containerRect.top}px`, "important");
                node.style.setProperty("left", `${rect.left - containerRect.left}px`, "important");
                node.style.setProperty("width", `${rect.width}px`, "important");
                node.style.setProperty("height", `${rect.height}px`, "important");

                const clickNode = node.cloneNode() as HTMLElement;
                clickNode.style.setProperty("background", "transparent", "important");
                clickNode.style.setProperty("cursor", "pointer", "important");
                clickNode.onclick = (e) => this.onRangeClick(e, range);

                this.backgroundContainer.appendChild(node);
                this.clickContainer.appendChild(clickNode);
            }
        });
    }

    private onRangeClick(e: Event, range: Range) {
        // @ts-ignore
        // if (e.target?.classList.contains("lindy-highlight") && e.target?.id) {
        //     return;
        // }

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        _createAnnotationFromSelection(
            (annotation) => {
                sendIframeEvent(this.annotationsModifier.sidebarIframe, {
                    event: "createHighlight",
                    annotation,
                });
                // onAnnotationUpdate("add", [annotation]);
            },
            this.annotationsModifier.sidebarIframe,
            generateId()
        );
    }
}
