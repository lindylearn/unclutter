import type { RelatedHighlight } from "@unclutter/library-components/dist/common/api";
import type { Annotation } from "@unclutter/library-components/dist/store/_schema";
import { describe as describeAnnotation } from "./annotator/anchoring/html";
import type { RankedSentence } from "./heatmap";

export function listParagraphs(document: Document, isJsdom = false): [HTMLElement[], string[]] {
    const paragraphsElements: HTMLElement[] = [];
    const paragraphTexts: string[] = [];
    document.querySelectorAll("p, font, li").forEach((paragraph: HTMLElement) => {
        // Ignore invisible nodes
        if (!isJsdom && paragraph.offsetHeight === 0) {
            return false;
        }

        // check text content (textContent to anchor range correctly)
        const rawText = paragraph.textContent;
        const cleanText = rawText?.replace(/[\s\n]+/g, " ").trim();
        if (!rawText || !cleanText || cleanText.length < 200) {
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
        if (paragraph.tagName === "CODE" || paragraph.parentElement?.tagName === "CODE") {
            return;
        }

        paragraphsElements.push(paragraph);
        // use raw text content to anchor sentences correctly later
        paragraphTexts.push(rawText);
    });

    return [paragraphsElements, paragraphTexts];
}

const excludedParagraphClassNames = [
    "comment", // https://civilservice.blog.gov.uk/2022/08/16/a-simple-guide-on-words-to-avoid-in-government/
    "reference", // https://en.wikipedia.org/wiki/Sunstone_(medieval)
];

export function createAnnotations(
    document: Document,
    paragraphElements: HTMLElement[],
    rankedSentencesByParagraph: RankedSentence[][],
    article_id: string,
    scoreThreshold: number
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
        let ranges = anchorParagraphSentences(
            document,
            paragraph,
            rankedSentences.map((s) => s.sentence)
        );

        // construct global annotationState
        ranges.forEach((range, i) => {
            const sentence = rankedSentences[i];

            // filter to only important sentences
            if (sentence.score < scoreThreshold) {
                return;
            }

            annotations.push({
                id: `ai_${article_id.slice(0, 20)}_${runningCount}`,
                article_id,
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
function anchorParagraphSentences(
    document: Document,
    paragraph: HTMLElement,
    sentences: string[]
): Range[] {
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
        const currentLength = currentElem.textContent?.length || 0;

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
            let nextElem: HTMLElement | undefined = undefined;
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
