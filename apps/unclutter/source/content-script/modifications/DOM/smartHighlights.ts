import ky from "ky";
import { PageModifier, trackModifierExecution } from "../_interface";
import { generateId, LindyAnnotation } from "../../../common/annotations/create";
import type AnnotationsModifier from "../annotations/annotationsModifier";
import { _createAnnotationFromSelection } from "../annotations/selectionListener";
import type TextContainerModifier from "./textContainer";
import { sendIframeEvent } from "../../../common/reactIframe";
import {
    enableAnnotationsFeatureFlag,
    enableExperimentalFeatures,
    getFeatureFlag,
} from "../../../common/featureFlags";

export interface RankedSentence {
    score: number;
    sentence: string;
    related?: RelatedHighlight[];
}
export interface RelatedHighlight {
    score: number;
    score2: number;
    text: string;
    excerpt: string;
    title: string;
}

interface AnnotationState {
    sentence: any;
    container: HTMLElement;
    range: Range;
    paintedElements?: HTMLElement[];
}

const excludedParagraphClassNames = [
    "comment", // https://civilservice.blog.gov.uk/2022/08/16/a-simple-guide-on-words-to-avoid-in-government/
    "reference", // https://en.wikipedia.org/wiki/Sunstone_(medieval)
];

@trackModifierExecution
export default class SmartHighlightsModifier implements PageModifier {
    private enabled: boolean = false;

    private annotationsModifier: AnnotationsModifier;
    private textContainerModifier: TextContainerModifier;
    private onHighlightClick: null | ((range: Range, related: RelatedHighlight[]) => void);

    articleSummary: string | null;
    keyPointsCount: number | null;
    relatedCount: number | null;
    relatedArticles: RelatedHighlight[] | null;

    constructor(
        annotationsModifier: AnnotationsModifier,
        textContainerModifier: TextContainerModifier,
        forceEnabled: boolean = false,
        onHighlightClick: (range: Range, related: RelatedHighlight[]) => void = null
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
        this.clickContainer = document.getElementsByClassName(
            "smart-highlight-click"
        )[0] as HTMLElement;
        this.scrollbarContainer = document.getElementsByClassName(
            "smart-highlight-scrollbar"
        )[0] as HTMLElement;
    }

    private paragraphs: HTMLElement[] = [];
    private rankedSentencesByParagraph: RankedSentence[][];
    async parseUnclutteredArticle() {
        if (!this.enabled) {
            return;
        }

        const paragraphTexts: string[] = [];
        document
            .querySelectorAll(this.textContainerModifier.usedTextElementSelector)
            .forEach((paragraph: HTMLElement) => {
                const textContent = paragraph.textContent;
                if (!textContent || textContent.length < 200) {
                    return;
                }

                if (
                    excludedParagraphClassNames.some((word) =>
                        paragraph.className.toLowerCase().includes(word)
                    ) ||
                    excludedParagraphClassNames.some((word) =>
                        paragraph.parentElement.className.toLowerCase().includes(word)
                    )
                ) {
                    return;
                }

                this.paragraphs.push(paragraph);
                paragraphTexts.push(textContent);
            });

        const response: any = await ky
            .post("https://q5ie5hjr3g.execute-api.us-east-2.amazonaws.com/default/heatmap", {
                json: {
                    title: document.title,
                    url: window.location.href,
                    paragraphs: paragraphTexts,
                },
                timeout: false,
            })
            .json();
        this.rankedSentencesByParagraph = response;
        // this.rankedSentencesByParagraph = response.rankings || null;
        // this.articleSummary = response.summary || null;
        // console.log(this.rankedSentencesByParagraph);

        this.keyPointsCount = 0;
        this.relatedCount = 0;
        this.rankedSentencesByParagraph?.forEach((paragraph) => {
            paragraph.forEach((sentence) => {
                if (sentence.score >= 0.6) {
                    this.keyPointsCount += 1;
                }
                if (sentence.related && sentence.related?.[0]?.score2 > 0.5) {
                    this.relatedCount += 1;
                }
            });
        });

        // this.relatedArticles = await ky
        //     .post("https://assistant-two.vercel.app/api/query", {
        //         json: {
        //             query: `${document.title}\n${paragraphTexts.slice(0, 3).join("\n")}`,
        //         },
        //         timeout: false,
        //     })
        //     .json();
        // this.relatedArticles = this.relatedArticles.filter((h) => h.score >= 0.5).slice(0, 3);

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

    private annotationState: AnnotationState[] = [];
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

            const container = this.getParagraphAnchor(paragraph);

            // anchor all sentences returned from backend
            let ranges = this.anchorParagraphSentences(
                paragraph,
                rankedSentences.map((s) => s.sentence)
            );

            // construct global annotationState
            ranges.forEach((range, i) => {
                const sentence = rankedSentences[i];
                if (sentence.related) {
                    sentence.score = sentence.related[0].score2 + 0.1;
                }

                // filter
                if (sentence.score < 0.6) {
                    return;
                }

                this.annotationState.push({
                    sentence,
                    container,
                    range,
                });
            });
        });

        // first paint
        this.paintAllAnnotations();

        // paint again on position change
        let isInitialPaint = true;
        const resizeObserver = new ResizeObserver(() => {
            if (isInitialPaint) {
                isInitialPaint = false;
                return;
            }

            this.paintAllAnnotations();
        });
        this.annotationState.forEach(({ container }) => {
            resizeObserver.observe(container);
        });
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

    private paintAllAnnotations() {
        console.log(`Painting ${this.annotationState.length} smart annotations`);

        this.annotationState.forEach(({ sentence, container, range }, i) => {
            const containerRect = container.getBoundingClientRect();

            this.annotationState[i].paintedElements?.forEach((e) => e.remove());

            let paintedElements = this.paintRange(container, containerRect, range, sentence);
            this.annotationState[i].paintedElements = paintedElements;
        });
    }

    disableAnnotations() {
        this.clickContainer?.remove();
        this.clickContainer = null;

        this.scrollbarContainer?.remove();
        this.scrollbarContainer = null;
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

        // debug
        // if (!paragraph.textContent.includes("discounts")) {
        //     return [];
        // }
        // console.log(paragraph, sentences);

        while (ranges.length < sentences.length) {
            if (!currentElem) {
                break;
            }

            const currentSentence = sentences[ranges.length];
            let currentSentenceLength = currentSentence.length;
            const currentLength = currentElem.textContent.length;

            // assume trailing space removed in backend
            // TODO handle this better
            let hasTrailingSpace = false;
            if (ranges.length < sentences.length - 1) {
                hasTrailingSpace = true;
                currentSentenceLength += 1;
            }

            // console.log({ currentElem });

            if (runningTextLength + currentLength < currentSentenceLength) {
                // console.log("skip", runningTextLength, currentLength, currentSentenceLength);

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

                    ranges.push(currentRange);
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

        return ranges;
    }

    private clickContainer: HTMLElement;
    private scrollbarContainer: HTMLElement;
    createContainers() {
        // this.clickContainer = document.createElement("div");
        // this.clickContainer.className = "lindy-smart-highlight-container smart-highlight-click";
        // this.clickContainer.style.setProperty("position", "absolute");
        // this.clickContainer.style.setProperty("top", "0");
        // this.clickContainer.style.setProperty("left", "0");
        // this.clickContainer.style.setProperty("z-index", "1001");
        // document.body.append(this.clickContainer);

        this.scrollbarContainer = document.createElement("div");
        this.scrollbarContainer.className =
            "lindy-smart-highlight-container smart-highlight-scrollbar";
        this.scrollbarContainer.style.setProperty("z-index", "1001");
        document.body.append(this.scrollbarContainer);
    }

    private styleObserver: MutationObserver;
    private styleChangesCount = 0;
    enableStyleTweaks() {
        this.patchScrollbarStyle();

        // site may override inline styles, e.g. https://www.fortressofdoors.com/ai-markets-for-lemons-and-the-great-logging-off/
        this.styleObserver = new MutationObserver(() => {
            // avoid infinite loops if there's another observer (e.g. in BodyStyleModifier)
            if (this.styleChangesCount > 10) {
                this.styleObserver.disconnect();
                return;
            }
            this.styleChangesCount += 1;

            this.patchScrollbarStyle();
        });
        this.styleObserver.observe(document.documentElement, {
            attributeFilter: ["style"],
        });
        this.styleObserver.observe(document.body, {
            attributeFilter: ["style"],
        });
    }

    private patchScrollbarStyle() {
        // put scrollbar on <body> to allow overlapping divs
        // only needed when called outside the reader mode
        console.log("Patching scrollbar style");

        document.documentElement.style.setProperty("overflow", "hidden", "important");

        document.body.style.setProperty("height", "100vh", "important");
        document.body.style.setProperty("max-height", "100vh", "important");
        document.body.style.setProperty("overflow", "auto", "important");

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

    disableStyleTweaks() {
        this.styleObserver.disconnect();

        document.documentElement.style.removeProperty("overflow");

        document.body.style.removeProperty("height");
        document.body.style.removeProperty("max-height");
        document.body.style.removeProperty("overflow");
    }

    private paintRange(
        container: HTMLElement,
        containerRect: DOMRect,
        range: Range,
        sentence: any
    ): HTMLElement[] {
        const color: string = sentence.related ? "168, 85, 247" : "250, 204, 21";
        const onClick = sentence.related
            ? (e) => this.onRangeClick(e, range, sentence.related)
            : null;

        let addedElements: HTMLElement[] = [];

        const rect = range.getBoundingClientRect();
        if (rect.top === 0) {
            // position error
            return [];
        }

        let lastRect: ClientRect;
        const clientRects = [...range.getClientRects()]
            // sort to avoid double-paint of <b> elements
            .sort((a, b) => {
                return a.top - b.top || a.left - b.left;
            })
            .reverse();
        for (const rect of clientRects) {
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
                `rgba(${color}, ${0.8 * sentence.score ** 3})`,
                "important"
            );
            node.style.setProperty("position", "absolute", "important");
            node.style.setProperty("top", `${rect.top - containerRect.top}px`, "important");
            node.style.setProperty("left", `${rect.left - containerRect.left}px`, "important");
            node.style.setProperty("width", `${rect.width}px`, "important");
            node.style.setProperty("height", `${rect.height}px`, "important");
            node.style.setProperty("z-index", `-1`, "important");

            container.prepend(node);
            addedElements.push(node);

            if (onClick) {
                const clickNode = node.cloneNode() as HTMLElement;
                clickNode.style.setProperty("background", "transparent", "important");
                clickNode.style.setProperty("cursor", "pointer", "important");
                clickNode.style.setProperty("z-index", `1001`, "important");

                clickNode.onclick = onClick;
                container.appendChild(clickNode);
                addedElements.push(clickNode);
            }
        }

        const scrollbarNode = document.createElement("div");
        scrollbarNode.className = "lindy-smart-highlight-scroll";
        scrollbarNode.style.setProperty(
            "background",
            `rgba(${color}, ${0.8 * sentence.score ** 3})`,
            "important"
        );
        scrollbarNode.style.setProperty(
            "top",
            `${(100 * (rect.top + document.body.scrollTop)) / document.body.scrollHeight}vh`,
            "important"
        );

        this.scrollbarContainer.appendChild(scrollbarNode);
        addedElements.push(scrollbarNode);

        return addedElements;
    }

    private onRangeClick(e: Event, range: Range, related: RelatedHighlight[]) {
        // @ts-ignore
        // if (e.target?.classList.contains("lindy-highlight") && e.target?.id) {
        //     return;
        // }

        if (this.onHighlightClick) {
            this.onHighlightClick(range, related);
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
