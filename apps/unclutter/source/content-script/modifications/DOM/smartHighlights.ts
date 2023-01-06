import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
// import { getRandomLightColor } from "@unclutter/library-components/dist/common/styling";
import browser from "../../../common/polyfill";
import { PageModifier, trackModifierExecution } from "../_interface";

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

const excludedParagraphClassNames = [
    "comment", // https://civilservice.blog.gov.uk/2022/08/16/a-simple-guide-on-words-to-avoid-in-government/
    "reference", // https://en.wikipedia.org/wiki/Sunstone_(medieval)
];

// analyse an article page and highlight key sentences using AI
@trackModifierExecution
export default class SmartHighlightsModifier implements PageModifier {
    private onHighlightClick: null | ((range: Range, related: RelatedHighlight[]) => void);

    articleSummary: string | null;
    keyPointsCount: number | null;
    relatedCount: number | null;
    topHighlights: RankedSentence[] | null;

    private scoreThreshold = 0.6;
    private relatedEnabled = true;

    constructor(onHighlightClick: (range: Range, related: RelatedHighlight[]) => void = null) {
        this.onHighlightClick = onHighlightClick;
    }

    private paragraphs: HTMLElement[] = [];
    private rankedSentencesByParagraph: RankedSentence[][];
    async parseUnclutteredArticle(): Promise<boolean> {
        let start = performance.now();

        // parse article paragraphs from page
        const paragraphTexts: string[] = [];
        document.querySelectorAll("p, font, li").forEach((paragraph: HTMLElement) => {
            // check text content
            const textContent = paragraph.textContent;
            const cleanTextContent = textContent?.replace(/[\s\n]+/g, " ").trim();
            if (!textContent || cleanTextContent.length < 200) {
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
            paragraphTexts.push(textContent);
        });

        if (paragraphTexts.length === 0 || paragraphTexts.length >= 200) {
            // likely not an article
            // be careful, e.g. paulgraham.com has single paragraph
            return false;
        }

        // construct sentence heatmap in extension background worker (with no data sent over the network)
        this.rankedSentencesByParagraph = await browser.runtime.sendMessage(null, {
            event: "getHeatmap",
            paragraphs: paragraphTexts,
        });

        // parse heatmap stats and most important sentences
        this.keyPointsCount = 0;
        const topHighlights: {
            highlight: string;
            paragraphIndex: number;
            sentenceIndex: number;
        }[] = [];
        this.rankedSentencesByParagraph?.forEach((paragraph, paragraphIndex) => {
            paragraph.forEach((sentence: RankedSentence, sentenceIndex) => {
                if (sentence.score >= this.scoreThreshold) {
                    this.keyPointsCount += 1;
                    topHighlights.push({
                        highlight: sentence.sentence,
                        paragraphIndex,
                        sentenceIndex,
                    });
                }
            });
        });
        console.log(topHighlights.map((s) => s.highlight?.replace(/[\s\n]+/g, " ").trim()));

        if (this.relatedEnabled) {
            // save significant sentences in user library, and fetch related existing highlights
            const response = await fetch(
                "https://q5ie5hjr3g.execute-api.us-east-2.amazonaws.com/default/related",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: document.title,
                        url: window.location.href,
                        highlights: topHighlights.map((s) => s.highlight),
                    }),
                }
            );
            const relatedPerHighlight: RelatedHighlight[][] = (await response.json())?.related;

            // add to rankedSentencesByParagraph
            this.relatedCount = 0;
            relatedPerHighlight.forEach((related, highlightIndex) => {
                // filter related now
                related = related.filter((r) => r.score >= 0.6);
                if (related.length === 0) {
                    return;
                }
                this.relatedCount += 1;

                const { paragraphIndex, sentenceIndex } = topHighlights[highlightIndex];
                this.rankedSentencesByParagraph[paragraphIndex][sentenceIndex].related = related;
            });
        }

        // paint highlights immediately once fetch done
        this.enableAnnotations();

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

    // paint AI highlights on the page
    private annotationState: {
        sentence: RankedSentence;
        container: HTMLElement;
        range: Range;
        paintedElements?: HTMLElement[];
        invalid?: boolean;
    }[] = [];
    enableAnnotations() {
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

        // immediate first paint
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

        this.annotationState.forEach(({ invalid, sentence, container, range }, i) => {
            if (invalid) {
                return;
            }
            if (
                !sentence.related &&
                sentence.score < this.scoreThreshold &&
                !this.enableAllSentences
            ) {
                return;
            }

            const containerRect = container.getBoundingClientRect();
            this.annotationState[i].paintedElements?.forEach((e) => e.remove());

            let paintedElements = this.paintRange(container, containerRect, range, sentence);
            if (paintedElements.length === 0) {
                this.annotationState[i].invalid = true;
            } else {
                this.annotationState[i].paintedElements = paintedElements;
            }
        });
    }

    disableScrollbar() {
        this.scrollbarContainer?.remove();
        this.scrollbarContainer = null;
    }

    disableAnnotations() {
        this.disableStyleTweaks();
        this.disableScrollbar();

        this.annotationState.forEach(({ paintedElements }) => {
            paintedElements?.forEach((e) => e.remove());
        });
        this.annotationState = [];
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

    private scrollbarContainer: HTMLElement;
    createContainers() {
        this.scrollbarContainer = document.createElement("div");
        this.scrollbarContainer.className = "smart-highlight-scrollbar";
        this.scrollbarContainer.style.setProperty("position", "relative", "important");
        this.scrollbarContainer.style.setProperty("z-index", "1001", "important");
        document.body.append(this.scrollbarContainer);
    }

    private styleObserver: MutationObserver;
    private styleChangesCount = 0;
    enableStyleTweaks() {
        this.patchAbsolutePositions(); // read before modify
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

    // Set concrete absolute positions so they work with the patched body height. E.g.:
    // - https://tedgioia.substack.com/p/what-can-we-learn-from-barnes-and
    // - https://www.benkuhn.net/abyss/
    private patchAbsolutePositions(maxDepth = 3) {
        // TODO undo later?

        function iterateNode(node: HTMLElement, depth: number = 0) {
            if (depth > maxDepth) {
                return;
            }

            const style = window.getComputedStyle(node);
            const position = style.position;
            if (position === "static") {
                [...node.children].forEach((node) => iterateNode(node as HTMLElement, depth + 1));
            } else if (position === "absolute") {
                node.style.setProperty("top", style.top, "important");
            }
        }

        [...document.body.children].forEach(iterateNode);
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
        sentence: RankedSentence
    ): HTMLElement[] {
        const color: string = sentence.related
            ? "rgba(168, 85, 247, 1.0)"
            : "rgba(250, 204, 21, 1.0)";
        // const color: string = getRandomLightColor(sentence.sentence);

        let score = sentence.score >= this.scoreThreshold ? sentence.score : 0;
        if (sentence.related) {
            score = sentence.related[0].score + 0.2;
        }
        const colorIntensity = 0.8 * score ** 3;
        const adjustedColor = color.replace("1.0", colorIntensity.toString());

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
            node.className = "lindy-smart-highlight";
            node.style.setProperty("--annotation-color", adjustedColor);
            node.style.setProperty("position", "absolute", "important");
            node.style.setProperty("top", `${rect.top - containerRect.top}px`, "important");
            node.style.setProperty("left", `${rect.left - containerRect.left}px`, "important");
            node.style.setProperty("width", `${rect.width}px`, "important");
            node.style.setProperty("height", `${rect.height}px`, "important");
            node.style.setProperty("z-index", `-1`, "important");

            container.prepend(node);
            addedElements.push(node);

            if (this.enableHighlightsClick || sentence.related) {
                const clickNode = node.cloneNode() as HTMLElement;
                clickNode.style.setProperty("background", "transparent", "important");
                clickNode.style.setProperty("cursor", "pointer", "important");
                clickNode.style.setProperty("z-index", `1001`, "important");

                clickNode.onclick = (e) => this.onRangeClick(e, range, sentence.related);
                container.appendChild(clickNode);
                addedElements.push(clickNode);
            }
        }

        if (this.enableScrollBar) {
            const scrollbarNode = document.createElement("div");
            scrollbarNode.className = "lindy-smart-highlight-scroll";
            scrollbarNode.style.setProperty("--annotation-color", adjustedColor);
            scrollbarNode.style.setProperty(
                "top",
                `${(100 * (rect.top + document.body.scrollTop)) / document.body.scrollHeight}vh`,
                "important"
            );

            this.scrollbarContainer?.appendChild(scrollbarNode);
            addedElements.push(scrollbarNode);
        }

        return addedElements;
    }

    enableScrollBar: boolean = true;
    enableHighlightsClick: boolean = false;
    enableAllSentences: boolean = false;
    isProxyActive: boolean = false;
    private onRangeClick(e: Event, range: Range, related: RelatedHighlight[]) {
        // TODO split handling for related annotations

        if (this.isProxyActive) {
            // pass to proxy running inside enhance.ts
            // TODO pass range instead of modifying the selection
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            window.postMessage({ type: "clickSmartHighlight" }, "*");
        } else {
            // handle in highlights.ts
            if (this.onHighlightClick) {
                this.onHighlightClick(range, related);
                return;
            }
        }
    }
}
