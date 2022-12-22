import ky from "ky";
import { PageModifier, trackModifierExecution } from "../_interface";
import { createAnnotation, generateId, LindyAnnotation } from "../../../common/annotations/create";
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
    private enabled: boolean = false;

    private annotationsModifier: AnnotationsModifier;
    private textContainerModifier: TextContainerModifier;
    private onHighlightClick: null | ((range: Range) => void);

    articleSummary: string | null;
    keyPointsCount: number | null;

    constructor(
        annotationsModifier: AnnotationsModifier,
        textContainerModifier: TextContainerModifier,
        forceEnabled: boolean = false,
        onHighlightClick: (range: Range) => void = null
    ) {
        this.annotationsModifier = annotationsModifier;
        this.textContainerModifier = textContainerModifier;
        this.onHighlightClick = onHighlightClick;

        if (forceEnabled) {
            this.enabled = true;
        } else {
            (async () => {
                const annotationsEnabled = await getFeatureFlag(enableAnnotationsFeatureFlag);
                const experimentsEnabled = await getFeatureFlag(enableExperimentalFeatures);
                this.enabled = (annotationsEnabled && experimentsEnabled) || forceEnabled;
            })();
        }
    }

    async parseArticle() {
        // fetch container references if already exist (e.g. from assistant code)
        this.backgroundContainer = document.getElementsByClassName(
            "smart-highlight-background"
        )[0] as HTMLElement;
        this.clickContainer = document.getElementsByClassName(
            "smart-highlight-click"
        )[0] as HTMLElement;
    }

    private paragraphs: HTMLElement[] = [];
    private rankedSentencesByParagraph: { score: number; sentence: string }[][];
    async parseUnclutteredArticle() {
        if (!this.enabled) {
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

        const response: any = await ky
            .post("https://q5ie5hjr3g.execute-api.us-east-2.amazonaws.com/default/heatmap", {
                json: {
                    paragraphs: paragraphTexts,
                },
                timeout: false,
            })
            .json();
        this.rankedSentencesByParagraph = response;
        this.articleSummary = null;
        this.keyPointsCount = null;
        // this.rankedSentencesByParagraph = response.rankings || null;
        // this.articleSummary = response.summary || null;
        // this.keyPointsCount = response.keyPointsCount || null;

        this.enableAnnotations();
        // if (this.annotationsModifier?.sidebarIframe) {
        //     sendIframeEvent(this.annotationsModifier.sidebarIframe, {
        //         event: "setSummaryAnnotation",
        //         summaryAnnotation: createAnnotation(window.location.href, null, {
        //             id: generateId(),
        //             platform: "summary",
        //             text: this.articleSummary,
        //             displayOffset: 0,
        //             displayOffsetEnd: 0,
        //         }),
        //     });
        // }
    }

    annotations: LindyAnnotation[] = [];
    enableAnnotations() {
        if (this.rankedSentencesByParagraph === undefined) {
            return this.parseArticle();
        }

        this.createContainers();

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

    disableAnnotations() {
        this.backgroundContainer?.remove();
        this.backgroundContainer = null;

        this.clickContainer?.remove();
        this.clickContainer = null;
    }

    setEnableAnnotations(enableAnnotations: boolean) {
        if (enableAnnotations) {
            this.enableAnnotations();
        } else {
            this.disableAnnotations();
        }
    }

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
            const currentSentenceLength = currentSentence.length + 1; // trailing space
            const currentLength = currentElem.textContent.length;

            // console.log({ currentElem });

            if (runningTextLength + currentLength < currentSentenceLength) {
                // console.log(
                //     "skip",
                //     runningTextLength,
                //     currentLength,
                //     currentSentenceLength
                // );
                // not enough text, skip entire node subtree
                runningTextLength += currentLength;
                if (currentElem.nextSibling) {
                    // next sibling
                    currentElem = currentElem.nextSibling as HTMLElement;
                } else if (!paragraph.contains(currentElem.parentElement?.nextSibling)) {
                    // end of paragraph (likely count error)
                    // console.log("break");

                    if (currentElem.parentElement?.nextSibling) {
                        currentRange.setEndAfter(paragraph);
                    } else {
                        // parent may not be defined, e.g. on https://www.theatlantic.com/ideas/archive/2022/12/volodymyr-zelensky-visit-ukraine-united-states/672528/
                        // how to handle?
                    }

                    // ranges.push(currentRange);
                    // console.log(currentRange.toString());
                    break;
                } else {
                    // next parent sibling
                    currentElem = currentElem.parentElement?.nextSibling as HTMLElement;
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
                    //     currentSentenceLength
                    // );

                    // sentence ends inside this node
                    const offset = currentSentenceLength - runningTextLength;
                    currentRange.setEnd(currentElem, offset - 1); // exclude trailing space
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
    private scrollbarContainer: HTMLElement;
    createContainers() {
        this.backgroundContainer = document.createElement("div");
        this.backgroundContainer.className =
            "lindy-smart-highlight-container smart-highlight-background";
        // this.backgroundContainer.style.setProperty("z-index", "-1");
        this.backgroundContainer.style.setProperty("position", "relative");
        document.body.prepend(this.backgroundContainer);

        this.clickContainer = document.createElement("div");
        this.clickContainer.className = "lindy-smart-highlight-container smart-highlight-click";
        this.clickContainer.style.setProperty("position", "absolute");
        this.clickContainer.style.setProperty("top", "0");
        this.clickContainer.style.setProperty("left", "0");
        this.clickContainer.style.setProperty("z-index", "1001");
        document.body.append(this.clickContainer);

        this.scrollbarContainer = document.createElement("div");
        this.scrollbarContainer.className =
            "lindy-smart-highlight-container smart-highlight-scrollbar";
        this.scrollbarContainer.style.setProperty("z-index", "1001");
        document.body.append(this.scrollbarContainer);
    }

    // put scrollbar on <body> to allow overlapping divs
    // only needed when called outside the reader mode
    fixScrollbars() {
        document.documentElement.style.overflow = "hidden";
        document.body.style.maxHeight = "100vh";
        document.body.style.overflow = "auto";

        const bodyStyle = window.getComputedStyle(document.body);
        if (bodyStyle.marginRight !== "0px") {
            // avoid space between scrollbar and window
            document.body.style.setProperty(
                "padding-right",
                `calc(${bodyStyle.paddingRight} + ${bodyStyle.marginRight})`,
                "important"
            );
            document.body.style.setProperty("margin-right", "0px", "important");
        }
        if (bodyStyle.position === "static") {
            // position absolute body children correctly
            document.body.style.setProperty("position", "relative", "important");
        }
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
                    `rgba(250, 204, 21, ${score >= 0.6 ? 0.8 * score ** 3 : 0})`,
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

            const rect = range.getBoundingClientRect();
            const scrollbarNode = document.createElement("div");
            scrollbarNode.className = "lindy-smart-highlight-scroll";
            scrollbarNode.style.setProperty(
                "background",
                `rgba(250, 204, 21, ${score >= 0.6 ? 0.8 * score ** 3 : 0})`,
                "important"
            );
            scrollbarNode.style.setProperty(
                "top",
                `${(100 * (rect.top - containerRect.top)) / document.body.scrollHeight}vh`,
                "important"
            );

            this.scrollbarContainer.appendChild(scrollbarNode);
        });
    }

    private onRangeClick(e: Event, range: Range) {
        // @ts-ignore
        // if (e.target?.classList.contains("lindy-highlight") && e.target?.id) {
        //     return;
        // }

        if (this.onHighlightClick) {
            this.onHighlightClick(range);
            return;
        }

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
