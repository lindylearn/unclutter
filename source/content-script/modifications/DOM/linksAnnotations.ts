import { PageModifier, trackModifierExecution } from "../_interface";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import {
    createLinkAnnotation,
    LindyAnnotation,
} from "../../../common/annotations/create";
import { getNodeOffset } from "../../../common/annotations/offset";
import { sendSidebarEvent } from "../annotations/annotationsListener";
import AnnotationsModifier from "../annotations/annotationsModifier";
import { highlightRange } from "../../../common/annotator/highlighter";
import { getLinkedArticles } from "../../../common/api";
import LibraryModifier from "../library";
import { LibraryArticle } from "../../../common/schema";
import { insertMarginBar } from "../annotations/highlightsApi";
import { openArticle } from "../../messaging";
import OverlayManager from "../overlay";

/*
    Parse links inside the article text and create annotations for them.
*/
@trackModifierExecution
export default class LinkAnnotationsModifier implements PageModifier {
    private annotationsModifier: AnnotationsModifier;
    private libraryModifier: LibraryModifier;
    private overlayManager: OverlayManager;

    constructor(
        annotationsModifier: AnnotationsModifier,
        libraryModifier: LibraryModifier,
        overlayManager: OverlayManager
    ) {
        this.annotationsModifier = annotationsModifier;
        this.libraryModifier = libraryModifier;
        this.overlayManager = overlayManager;
    }

    annotations: LindyAnnotation[] = [];
    async parseArticle() {
        const links = [...document.body.querySelectorAll("a")]
            .map((link) => {
                // Ignore invisible nodes
                if (link.offsetHeight === 0) {
                    return null;
                }

                const href = link.getAttribute("href");
                if (!href || !href.startsWith("http")) {
                    return null;
                }

                return [href, link];
            })
            .filter((e) => e !== null) as [string, HTMLAnchorElement][];

        const articles = await getLinkedArticles(
            links.map((e) => e[0]),
            this.libraryModifier.libraryState.libraryUser
        );

        // open reader view for article links
        links.map(([href, link], index) => {
            const article = articles[index];
            if (article) {
                link.onclick = (e) => {
                    e.preventDefault();
                    openArticle(article.url);
                };
            }
        });

        this.overlayManager.updateLinkedArticles(articles.filter((a) => a));

        // Create annotations
        // this.annotations = links
        //     .map(([href, link], index) => {
        //         const article = articles[index];
        //         if (!article) {
        //             // invalid or non-article sites
        //             return;
        //         }

        //         return this.createAnnotationFromLink(link, article);
        //     })
        //     .filter((a) => a);

        // insertMarginBar(
        //     this.annotations,
        //     this.annotationsModifier.sidebarIframe
        // );
        // this.annotationsModifier.setInfoAnnotations(this.annotations);
    }

    private createAnnotationFromLink(
        link: HTMLAnchorElement,
        article: LibraryArticle
    ): LindyAnnotation | null {
        const range = document.createRange();
        range.selectNode(link);
        const selector = describeAnnotation(document.body, range);
        if (!selector) {
            return null;
        }

        const annotation = {
            ...createLinkAnnotation(window.location.href, selector, article),
            displayOffset: getNodeOffset(link),
            displayOffsetEnd: getNodeOffset(link, "bottom"),
        };

        this.wrapLink(annotation.id, link, article);

        return annotation;
    }

    private wrapLink(
        annotationId: string,
        link: HTMLAnchorElement,
        article: LibraryArticle
    ) {
        // set id & class to update display offsets on resize
        // wrapping with custom <lindy-highlight> elem seems to not work
        link.id = annotationId;
        link.classList.add("lindy-link-info");

        link.onclick = (e) => {
            e.preventDefault();
            openArticle(article.url);
        };
    }
}
