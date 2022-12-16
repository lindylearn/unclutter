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
import { splitSentences } from "@unclutter/library-components/dist/common";

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

    annotations: LindyAnnotation[] = [];
    async parseArticle() {
        document
            .querySelectorAll(this.textContainerModifier.usedTextElementSelector)
            .forEach((paragraph: HTMLElement) => {
                try {
                    const sentences = splitSentences(paragraph.textContent);
                    console.log("#####");
                    console.log(sentences);

                    const ranges: Range[] = [];

                    // create ranges for each sentence by iterating leaf children
                    let currentElem: HTMLElement = paragraph.childNodes[0] as HTMLElement;
                    let runningTextLength = 0;
                    let currentRange = document.createRange();
                    currentRange.setStart(currentElem, 0);

                    while (ranges.length < sentences.length) {
                        if (!currentElem) {
                            break;
                        }

                        const currentSentence = sentences[ranges.length];
                        const currentLength = currentElem.textContent.length;

                        console.log({ currentElem });

                        if (runningTextLength + currentLength < currentSentence.length) {
                            console.log(
                                "skip",
                                runningTextLength,
                                currentLength,
                                currentSentence.length
                            );
                            // not enough text, skip entire node subtree
                            runningTextLength += currentLength;
                            if (currentElem.nextElementSibling) {
                                // next sibling
                                currentElem = currentElem.nextElementSibling as HTMLElement;
                            } else if (
                                !paragraph.contains(currentElem.parentElement.nextElementSibling)
                            ) {
                                // end of paragraph (likely count error)
                                console.log("break");

                                currentRange.setEndAfter(paragraph);
                                ranges.push(currentRange);
                                console.log(currentRange.toString());
                                break;
                            } else {
                                // next parent sibling
                                currentElem = currentElem.parentElement
                                    .nextElementSibling as HTMLElement;
                            }
                        } else {
                            if (currentElem.childNodes.length > 0) {
                                // iterate children
                                console.log("iterate children");
                                currentElem = currentElem.childNodes[0] as HTMLElement;
                                continue;
                            } else {
                                // slice text content
                                console.log(
                                    "slice",
                                    runningTextLength,
                                    currentLength,
                                    currentSentence.length
                                );

                                // sentence ends inside this node
                                const offset = currentSentence.length - runningTextLength;
                                currentRange.setEnd(currentElem, offset);
                                ranges.push(currentRange);
                                console.log(currentRange.toString());

                                // start new range
                                currentRange = document.createRange();
                                currentRange.setStart(currentElem, offset);
                                runningTextLength = -offset; // handle in next iteration

                                console.log("---");
                            }
                        }
                    }

                    console.log(ranges);
                    ranges.map((range) => {
                        const wrapper = highlightRange("test", range, "lindy-smart-highlight");
                    });
                } catch (err) {
                    console.error(err);
                }
            });
    }
}
