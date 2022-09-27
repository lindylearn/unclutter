import { PageModifier, trackModifierExecution } from "../_interface";
import { describe as describeAnnotation } from "../../../common/annotator/anchoring/html";
import {
    createLinkAnnotation,
    LindyAnnotation,
} from "../../../common/annotations/create";
import { getNodeOffset } from "../../../common/annotations/offset";
import AnnotationsModifier from "../annotations/annotationsModifier";
import { createScreenshots, getLinkedArticles } from "../../../common/api";
import LibraryModifier from "../library";
import { Article } from "@unclutter/library-components/dist/store/_schema";
import { openArticle } from "../../messaging";
import OverlayManager from "../overlay";
import {
    extensionSupportsUrl,
    isNonLeafPage,
} from "../../../common/articleDetection";

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
        if (!this.libraryModifier.libraryState.libraryUser) {
            return;
        }

        const linksPerHref: { [href: string]: HTMLAnchorElement[] } = {};
        [...document.body.querySelectorAll("a")].map((link) => {
            // Ignore invisible nodes
            if (link.offsetHeight === 0) {
                return;
            }

            // test if is likely article
            const href = link.getAttribute("href");
            if (!href || !href.startsWith("http")) {
                return;
            }
            try {
                const url = new URL(href);
                if (!extensionSupportsUrl(url) || isNonLeafPage(url)) {
                    return;
                }
            } catch {
                // url may be invalid
                return;
            }

            // save for remote fetch
            if (!linksPerHref[href]) {
                linksPerHref[href] = [];
            }
            linksPerHref[href].push(link);

            // open reader view for article links
            link.onclick = (e) => {
                e.preventDefault();
                openArticle(href);
            };
        });

        const hrefs = Object.keys(linksPerHref)
            .sort((a, b) => linksPerHref[b].length - linksPerHref[a].length)
            .slice(0, 5);
        if (hrefs.length === 0) {
            return;
        }

        // run article & screenshots fetch in parallel, to show results faster & re-render once screenshots complete
        let articles: Article[] = [];
        getLinkedArticles(
            hrefs,
            this.libraryModifier.libraryState.libraryUser
        ).then((newArticles) => {
            articles = newArticles;
            this.overlayManager.updateLinkedArticles(articles);
        });
        createScreenshots(hrefs).then(async (newUrls: string[]) => {
            if (articles.length > 0 && newUrls.length > 0) {
                // needs some time to propagate
                await new Promise((resolve) => setTimeout(resolve, 3000));

                // force re-render
                const newUrlsSet = new Set(newUrls);
                this.overlayManager.updateLinkedArticles(
                    articles.map((a) => ({
                        ...a,
                        bust_image_cache: newUrlsSet.has(a.url),
                    }))
                );
            }
        });

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
        article: Article
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
        article: Article
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
