import SmartHighlightsModifier, {
    RelatedHighlight,
} from "../../content-script/modifications/DOM/smartHighlights";
import HighlightDetailSvelte from "./HighlightDetail.svelte";
import ArticleCardSvelte from "./ArticleCard.svelte";

export function startAssistant(enablePageView: (reason: string) => void) {
    // document.addEventListener("mousedown", onSelectionStart);
    // document.addEventListener("mouseup", onSelectionDone);
    // document.addEventListener("contextmenu", removeHighligher);

    document.addEventListener("mouseup", (event) => {
        const target = event.target as HTMLElement;
        if (!target.classList.contains("lindy-smart-highlight-absolute")) {
            removeHighligher();
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            // complete text may lazy load, e.g. on https://arstechnica.com/tech-policy/2022/01/amazon-ends-widely-mocked-scheme-that-turned-workers-into-twitter-ambassadors/
            // setTimeout(() => {
            onDocumentReady(enablePageView);
            // }, 1000);
        });
    } else {
        onDocumentReady(enablePageView);
    }
}

function onDocumentReady(enablePageView: (reason: string) => void) {
    const readingTimeMinutes = document.body.innerText.trim().split(/\s+/).length / 200;
    const linkCount = document.querySelectorAll("a").length;
    // const linksPerMinute = linkCount / readingTimeMinutes;
    console.log({ readingTimeMinutes, linkCount });
    if (readingTimeMinutes < 2) {
        console.log("Ignoring likely non-article page");
        return;
    }

    const font = document.createElement("link");
    font.href = "https://fonts.googleapis.com/css2?family=Poppins&family=Work+Sans+SC&display=swap";
    font.rel = "stylesheet";
    document.head.appendChild(font);

    function onHighlightClick(range: Range, related: RelatedHighlight[]) {
        // enablePageView("smart-highlight");

        removeHighligher();
        const rect = range.getBoundingClientRect();
        const quote = range.toString();
        renderHighlighter(rect, quote, related);
    }
    const smartHighlightsModifier = new SmartHighlightsModifier(
        null,
        // @ts-ignore
        { usedTextElementSelector: "p, font, li" },
        true,
        onHighlightClick
    );

    smartHighlightsModifier.fixScrollbars();
    smartHighlightsModifier.parseUnclutteredArticle().then(() => {
        renderArticleCard(
            Math.ceil(readingTimeMinutes),
            smartHighlightsModifier.keyPointsCount,
            smartHighlightsModifier.relatedCount,
            smartHighlightsModifier.relatedArticles,
            smartHighlightsModifier.articleSummary,
            enablePageView
        );
    });
}

// function onSelectionStart(event: Event) {
//     removeHighligher();
// }

// function onSelectionDone() {
//     const selection = document.getSelection();
//     const quote = selection.toString();
//     if (!quote) {
//         return;
//     }

//     const rect = selection.getRangeAt(0).getBoundingClientRect();
//     renderHighlighter(rect, quote);
// }

function removeHighligher() {
    document.getElementById("lindy-highlighter")?.remove();
}

function renderHighlighter(highlightRect: DOMRect, quote: string, related: RelatedHighlight[]) {
    const container = document.createElement("div");
    container.id = "lindy-highlighter";
    container.style.position = "absolute";
    container.style.zIndex = "9999999999";
    container.style.top = `${
        highlightRect.top + highlightRect.height + window.scrollY + document.body.scrollTop
    }px`;
    container.style.left = `${highlightRect.left}px`;

    document.body.appendChild(container);

    new HighlightDetailSvelte({
        target: container,
        props: { quote, related },
    });

    // allow clicks on the highlighter
    container.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    container.addEventListener("mouseup", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
}

function renderArticleCard(
    readingTimeMinutes: number,
    keyPointsCount: number,
    relatedCount: number,
    relatedArticles: RelatedHighlight[],
    articleSummary: string,
    enablePageView: (reason: string) => void
) {
    const container = document.createElement("div");
    container.id = "lindy-page-card";
    container.style.position = "fixed";
    container.style.top = `10px`;
    container.style.right = `25px`;
    container.style.zIndex = `9999999999`;
    document.body.appendChild(container);

    new ArticleCardSvelte({
        target: container,
        props: {
            readingTimeMinutes,
            keyPointsCount,
            relatedCount,
            relatedArticles,
            articleSummary,
            enablePageView,
        },
    });
}
