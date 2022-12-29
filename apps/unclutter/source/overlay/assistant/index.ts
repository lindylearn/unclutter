import SmartHighlightsModifier, {
    RelatedHighlight,
} from "../../content-script/modifications/DOM/smartHighlights";
// import HighlightDetailSvelte from "./HighlightDetail.svelte";
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
    const smartHighlightsModifier = new SmartHighlightsModifier(onHighlightClick);

    smartHighlightsModifier.enableStyleTweaks();

    const enablePageViewInner = (reason: string) => {
        // disable scrollbar for reader mode
        smartHighlightsModifier.disableStyleTweaks();
        smartHighlightsModifier.disableScrollbar();

        // handle clicks on highlights in enhance.ts
        smartHighlightsModifier.isProxyActive = true;

        // enable click layer on next re-paint
        smartHighlightsModifier.enableHighlightsClick = true;

        // smartHighlightsModifier.enableAllSentences = true;

        enablePageView(reason);
    };
    smartHighlightsModifier.parseUnclutteredArticle().then(() => {
        renderArticleCard(
            smartHighlightsModifier.keyPointsCount,
            smartHighlightsModifier.relatedCount,
            smartHighlightsModifier.relatedArticles,
            smartHighlightsModifier.articleSummary,
            enablePageViewInner
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

    // new HighlightDetailSvelte({
    //     target: container,
    //     props: { quote, related },
    // });

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
            keyPointsCount,
            relatedCount,
            relatedArticles,
            articleSummary,
            enablePageView,
        },
    });
}
