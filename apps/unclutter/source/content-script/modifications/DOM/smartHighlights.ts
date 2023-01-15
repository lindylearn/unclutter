import debounce from "lodash/debounce";
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
} from "../../../common/api";
import { insertMarginBar } from "../annotations/highlightsApi";
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
    private onHighlightClick: null | ((range: Range, related: RelatedHighlight[]) => void);

    articleSummary: string | null = null;
    keyPointsCount: number | null = null;
    relatedCount: number | null = null;
    topHighlights: {
        highlight: string;
        paragraphIndex: number;
        sentenceIndex: number;
    }[] = [];

    private scoreThreshold = 0.6;
    private relatedThreshold = 0.5;

    constructor(
        user_id: string,
        onHighlightClick: (range: Range, related: RelatedHighlight[]) => void = null
    ) {
        this.user_id = user_id;
        this.article_id = getUrlHash(window.location.href);
        this.onHighlightClick = onHighlightClick;

        window.addEventListener("message", (event) => this.handleMessage(event.data || {}));
    }

    private handleMessage(message: any) {
        if (message.type === "sendSmartHighlightsToSidebar") {
            // sent from AnnotationsModifier once sidebar is ready
            const sidebarIframe = document.getElementById(
                "lindy-annotations-bar"
            ) as HTMLIFrameElement;
            if (sidebarIframe && this.annotations.length > 0) {
                // disabled automatic show
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
        this.enableAnnotations();

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
        indexAnnotationVectors(
            this.user_id,
            this.article_id,
            this.topHighlights.map((h) => h.highlight),
            undefined,
            true
        );

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
                related = related.slice(0, 2);
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
        this.enableAnnotations();
    }

    // paint AI highlights on the page
    private resizeObserver: ResizeObserver;
    private annotationState: {
        sentence: RankedSentence;
        container: HTMLElement;
        range: Range;
        paintedElements?: HTMLElement[];
        invalid?: boolean;
    }[] = [];
    enableAnnotations() {
        this.createContainers();

        // ensure clean state
        // TODO repaint only changed (e.g. after related fetch)
        this.annotationState.forEach(({ paintedElements }) => {
            paintedElements?.forEach((e) => e.remove());
        });
        this.annotations = [];
        this.annotationState = [];
        this.resizeObserver?.disconnect();

        this.paragraphs.forEach((paragraph, index) => {
            const rankedSentences = this.rankedSentencesByParagraph?.[index];
            if (!rankedSentences) {
                return;
            }

            // consider related anchors independently
            const textFragments: RankedSentence[] = [];
            rankedSentences.forEach((sentence, index) => {
                if (!sentence.related || !sentence.related[0].anchor) {
                    textFragments.push(sentence);
                } else {
                    // process specific anchor sentences

                    const anchor = sentence.related[0].anchor;
                    const anchorIndex = sentence.sentence.indexOf(anchor);

                    // before anchor text
                    if (anchorIndex > 0) {
                        textFragments.push({
                            id: `${sentence.id}_before`,
                            sentence: sentence.sentence.slice(0, anchorIndex),
                            score: 0, // sentence.score,
                        });
                    }
                    // anchor text
                    textFragments.push({
                        id: sentence.id,
                        sentence: anchor + " ",
                        score: sentence.score,
                        related: sentence.related,
                    });
                    // after anchor text
                    const end = anchorIndex + anchor.length + 1;
                    if (end < sentence.sentence.length) {
                        textFragments.push({
                            id: `${sentence.id}_after`,
                            sentence: sentence.sentence.slice(end),
                            score: 0, // sentence.score,
                        });
                    }
                }
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

                if (sentence.related) {
                    // displayOffsets set via changedDisplayOffset once painted
                    // this avoids rendering annotations for un-anchored highlights
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

                this.annotationState.push({
                    sentence,
                    container,
                    range,
                });
            });
        });

        // send constructed annotations to sidebar if present
        const sidebarIframe = document.getElementById("lindy-annotations-bar") as HTMLIFrameElement;
        if (sidebarIframe && this.annotations.length > 0) {
            sendIframeEvent(sidebarIframe, {
                event: "setInfoAnnotations",
                annotations: this.annotations,
            });
        }

        // immediate first paint
        this.paintAllAnnotations();

        // paint again on container position change
        let ignoreNextCall = true;
        const onResized = () => {
            // ignore first call on observe()
            if (ignoreNextCall) {
                ignoreNextCall = false;
                return;
            }

            console.log("Smart annotations changed position, repainting...");
            this.paintAllAnnotations();
        };
        // TODO animate rect movement?
        this.resizeObserver = new ResizeObserver(debounce(onResized, 200));
        this.annotationState.forEach(({ container }) => {
            this.resizeObserver.observe(container);
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

    // save last offsets to send to sidebar once requested
    private offsetById: { [id: string]: number } = {};
    private offsetEndById: { [id: string]: number } = {};
    private paintAllAnnotations() {
        console.log(`Painting ${this.annotationState.length} smart annotations`);

        // update sidebar annotation offsets
        this.annotationState.forEach(({ invalid, sentence, container, range }, i) => {
            if (invalid) {
                return;
            }

            if (
                !sentence.related &&
                !this.enableAllSentences &&
                sentence.score < this.scoreThreshold
            ) {
                return;
            }

            const containerRect = container.getBoundingClientRect();
            this.annotationState[i].paintedElements?.forEach((e) => e.remove());

            let paintedElements = this.paintRange(container, containerRect, range, sentence);
            if (paintedElements.length === 0) {
                // e.g. removed by content block
                this.annotationState[i].invalid = true;
            } else {
                this.annotationState[i].paintedElements = paintedElements;
            }

            if (sentence.related) {
                let displayOffset = getNodeOffset(range);
                let displayOffsetEnd = getNodeOffset(range, "bottom");
                if (paintedElements.length === 0) {
                    // null to remove
                    displayOffset = null;
                    displayOffsetEnd = null;
                }

                sentence.related.forEach((r, i) => {
                    const annotationId = `${sentence.id}_${i}`;
                    this.offsetById[annotationId] = displayOffset;
                    this.offsetEndById[annotationId] = displayOffsetEnd;
                });
            }
        });

        const sidebarIframe = document.getElementById("lindy-annotations-bar") as HTMLIFrameElement;
        if (sidebarIframe && Object.keys(this.offsetById).length > 0) {
            sendIframeEvent(sidebarIframe, {
                event: "changedDisplayOffset",
                offsetById: this.offsetById,
                offsetEndById: this.offsetEndById,
            });

            // insertMarginBar(
            //     this.annotations
            //         .map((a) => {
            //             // take only first
            //             if (!a.id.endsWith("_0")) {
            //                 return null;
            //             }
            //             return {
            //                 ...a,
            //                 displayOffset: this.offsetById[a.id],
            //                 displayOffsetEnd: this.offsetEndById[a.id],
            //             };
            //         })
            //         .filter((e) => e !== null)
            // );
        }
    }

    disableScrollbar() {
        this.scrollbarContainer?.remove();
        this.scrollbarContainer = null;
    }

    disableAnnotations() {
        this.resizeObserver?.disconnect();

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

    private scrollbarContainer: HTMLElement;
    createContainers() {
        if (this.scrollbarContainer) {
            return;
        }

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
        const color = "rgba(250, 204, 21, 1.0)";
        // const color: string = sentence.related
        //     ? "rgba(168, 85, 247, 1.0)"
        //     : "rgba(250, 204, 21, 1.0)";
        // const color: string = getRandomLightColor(sentence.sentence);

        let score = sentence.score >= this.scoreThreshold ? sentence.score : 0;
        if (sentence.related) {
            // score = sentence.related[0].score + 0.2;
        }
        const lightColor = color.replace("1.0", `${0.8 * score ** 3}`);
        const darkColor = color.replace("1.0", `${0.5 * score ** 3}`);

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

        clientRects.forEach((rect, rectIndex) => {
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
                return;
            }
            lastRect = rect;

            const node = document.createElement("div");
            // consider first rect in annotationListener resize handler
            node.id = rectIndex === 0 ? sentence.id : `${sentence.id}_${rectIndex}`;
            node.className = "lindy-smart-highlight";
            node.style.setProperty("--annotation-color", lightColor);
            node.style.setProperty("--darker-annotation-color", darkColor);
            node.style.setProperty("position", "absolute", "important");
            node.style.setProperty("top", `${rect.top - containerRect.top}px`, "important");
            node.style.setProperty("left", `${rect.left - containerRect.left}px`, "important");
            node.style.setProperty("width", `${rect.width}px`, "important");
            node.style.setProperty("height", `${rect.height}px`, "important");
            node.style.setProperty("z-index", `-1`, "important");

            container.prepend(node);
            addedElements.push(node);

            if (this.enableHighlightsClick || (sentence.related && !this.isProxyActive)) {
                const clickNode = node.cloneNode() as HTMLElement;
                clickNode.className = "lindy-smart-highlight-click";
                clickNode.style.setProperty("z-index", `1001`, "important");

                clickNode.onclick = (e) => this.onRangeClick(e, range, sentence.related);
                container.appendChild(clickNode);
                addedElements.push(clickNode);
            }
        });

        if (this.enableScrollBar) {
            const scrollbarNode = document.createElement("div");
            scrollbarNode.className = "lindy-smart-highlight-scroll";
            scrollbarNode.style.setProperty("--annotation-color", lightColor);
            scrollbarNode.style.setProperty("--darker-annotation-color", darkColor);
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
        // can't send Range via postMessage, so anchor in highlights.ts
        const selector = describeAnnotation(document.body, range);
        if (!selector) {
            return;
        }

        if (this.isProxyActive) {
            // pass to proxy running inside enhance.ts
            window.postMessage({ type: "clickSmartHighlight", selector }, "*");
        } else {
            // handle in highlights.ts
            if (this.onHighlightClick) {
                this.onHighlightClick(range, related);
                return;
            }
        }
    }
}
