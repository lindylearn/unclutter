import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import browser from "../../../common/polyfill";
import { PageModifier, trackModifierExecution } from "../_interface";
import { sendIframeEvent } from "../../../common/reactIframe";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import {
    fetchRelatedAnnotations,
    indexAnnotationVectors,
    RelatedHighlight,
} from "@unclutter/library-components/dist/common/api";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import type { Annotation } from "@unclutter/library-components/dist/store/_schema";
import { createAnnotations, listParagraphs } from "@unclutter/heatmap/dist/anchor";
import { RankedSentence } from "@unclutter/heatmap/dist/heatmap";

// analyse an article page and highlight key sentences using an in-browser AI model
@trackModifierExecution
export default class SmartHighlightsModifier implements PageModifier {
    private user_id: string;
    private article_id: string;

    annotations: Annotation[];
    annotationsCount: number | null;
    relatedCount: number | null;

    private scoreThreshold = 0.6;
    private relatedThreshold = 0.5;

    constructor(user_id: string) {
        this.user_id = user_id;
        this.article_id = getUrlHash(window.location.href);

        window.addEventListener("message", (event) => this.handleMessage(event.data || {}));
    }

    private generatedAnnotations: boolean = false;
    async fetchAnnotations(fetchSaved = true): Promise<boolean> {
        if (fetchSaved) {
            // fetch existing user annotations locally
            const rep = new ReplicacheProxy();
            this.annotations = await rep.query.listArticleAnnotations(this.article_id);
            console.log(`Found ${this.annotations.length} local annotations for article`);
        } else {
            this.annotations = [];
        }

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
        reportEventContentScript("renderHighlightsLayer", {
            paragraphCount: paragraphsElements.length,
            annotationsCount: this.annotationsCount,
            relatedCount: this.relatedCount,
            durationMs,
        });

        return newAnnotations;
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

        this.relatedCount = 0;
        relatedPerAnnotation.forEach((related) => {
            this.relatedCount += related.length;
        });

        // send to sidebar if already ready
        // this.relatedPerAnnotation = relatedPerAnnotation;
        // this.sendAnnotationsToSidebar();
    }

    private handleMessage(message: any) {
        if (message.type === "sendAIAnnotationsToSidebar") {
            // event sent from AnnotationsModifier once sidebar is ready
            // reply with annotations (only if related done)
            // if (this.relatedPerAnnotation) {
            //     this.sendAnnotationsToSidebar();
            // }
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
            aiAnnotations.map((a) => a.id),
            false
        );
    }
}
