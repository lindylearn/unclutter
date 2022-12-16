import ky from "ky";
import { PageModifier, trackModifierExecution } from "../_interface";
import { generateId, LindyAnnotation } from "../../../common/annotations/create";
import AnnotationsModifier from "../annotations/annotationsModifier";
import { _createAnnotationFromSelection } from "../annotations/selectionListener";
import TextContainerModifier from "./textContainer";
import { splitSentences } from "@unclutter/library-components/dist/common";
import { sendIframeEvent } from "../../../common/reactIframe";

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
                    const textContent = paragraph.textContent;
                    if (!textContent) {
                        return;
                    }

                    console.log("#####");
                    console.log(paragraph);
                    let sentences = splitSentences(textContent);
                    console.log(sentences);

                    // combine small sentences
                    const combinedSentences: string[] = [sentences[0]];
                    sentences.slice(1).forEach((sentence, index) => {
                        const lastSentence = combinedSentences.pop();

                        if (lastSentence.length < 100) {
                            combinedSentences.push(lastSentence + sentence);
                        } else {
                            combinedSentences.push(lastSentence);
                            combinedSentences.push(sentence);
                        }
                    });
                    sentences = combinedSentences;
                    console.log(sentences);

                    const ranges: Range[] = [];

                    // create ranges for each sentence by iterating leaf children
                    let currentElem: HTMLElement = paragraph as HTMLElement;
                    let runningTextLength = 0;
                    let currentRange = document.createRange();
                    currentRange.setStart(currentElem, 0);

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

                    console.log(ranges);
                    ranges.map((range) => {
                        console.log(range.cloneRange().toString());

                        // const wrapper = highlightRange("test", range, "lindy-smart-highlight");
                        const wrapper = document.createElement("lindy-highlight");
                        wrapper.className = "lindy-smart-highlight";
                        // wrapper.id = "";

                        wrapper.appendChild(range.extractContents());
                        range.insertNode(wrapper);

                        wrapper.onclick = () => {
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
                        };
                    });
                } catch (err) {
                    console.error(err);
                }
            });
    }
}
