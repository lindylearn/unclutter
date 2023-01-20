import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import browser from "../../../common/polyfill";
import { PageModifier, trackModifierExecution } from "../_interface";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import type { Annotation } from "@unclutter/library-components/dist/store/_schema";
import { createAnnotations, listParagraphs } from "@unclutter/heatmap/dist/anchor";
import type { RankedSentence } from "@unclutter/heatmap/dist/heatmap";

// analyse an article page and highlight key sentences using an in-browser AI model
@trackModifierExecution
export default class SmartHighlightsModifier implements PageModifier {
    private article_id: string;
    private scoreThreshold = 0.6;

    constructor() {
        this.article_id = getUrlHash(window.location.href);
    }

    async parseAnnotationsFromArticle(): Promise<Annotation[]> {
        console.log(`Generating AI highlights for article...`);
        let start = performance.now();

        // parse DOM and extract significant text elements
        const [paragraphsElements, paragraphTexts] = listParagraphs(document);
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
        } catch (err) {
            console.error(err);
            return [];
        }

        // create annotations for significant detected quotes
        const newAnnotations = createAnnotations(
            document,
            paragraphsElements,
            rankedSentencesByParagraph,
            this.article_id,
            this.scoreThreshold
        );

        // report diagnostics
        let durationMs = Math.round(performance.now() - start);
        console.log(`Generated ${newAnnotations.length} AI highlights in ${durationMs}ms`);
        reportEventContentScript("generateAIHighlights", {
            paragraphCount: paragraphsElements.length,
            annotationsCount: newAnnotations.length,
            durationMs,
        });

        return newAnnotations;
    }
}
