import SmartHighlightsModifier from "../../content-script/modifications/DOM/smartHighlights";
import HighlightDetailSvelte from "./HighlightDetail.svelte";
import ArticleCardSvelte from "./ArticleCard.svelte";
import ArticleEdgeSvelte from "./ArticleEdge.svelte";

export function startAssistant(enablePageView: (reason: string) => void) {
    // document.addEventListener("mousedown", onSelectionStart);
    // document.addEventListener("mouseup", onSelectionDone);
    // document.addEventListener("contextmenu", removeHighligher);

    // document.addEventListener("mouseup", (event) => {
    //     const target = event.target as HTMLElement;
    //     if (!target.classList.contains("lindy-smart-highlight-absolute")) {
    //         removeHighligher();
    //     }
    // });

    if (document.readyState !== "complete") {
        document.addEventListener("DOMContentLoaded", () => {
            onDocumentReady(enablePageView);
        });
    } else {
        onDocumentReady(enablePageView);
    }
}

function onDocumentReady(enablePageView: (reason: string) => void) {
    const readingTimeMinutes = document.body.innerText.trim().split(/\s+/).length / 200;
    if (readingTimeMinutes < 2) {
        console.log("Ignoring likely non-article page");
        return;
    }

    const font = document.createElement("link");
    font.href = "https://fonts.googleapis.com/css2?family=Poppins&family=Work+Sans+SC&display=swap";
    font.rel = "stylesheet";
    document.head.appendChild(font);

    function onHighlightClick(range: Range) {
        enablePageView("smart-highlight");

        // removeHighligher();
        // const rect = range.getBoundingClientRect();
        // const quote = range.toString();
        // renderHighlighter(rect, quote);
    }
    const smartHighlightsModifier = new SmartHighlightsModifier(
        null,
        // @ts-ignore
        { usedTextElementSelector: "p, font, li" },
        true,
        onHighlightClick
    );
    smartHighlightsModifier.parseUnclutteredArticle().then(() => {
        renderArticleCard(
            Math.ceil(readingTimeMinutes),
            smartHighlightsModifier.keyPointsCount,
            smartHighlightsModifier.articleSummary,
            enablePageView
        );
    });
}

function onSelectionStart(event: Event) {
    removeHighligher();
}

function onSelectionDone() {
    const selection = document.getSelection();
    const quote = selection.toString();
    if (!quote) {
        return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    renderHighlighter(rect, quote);
}

function removeHighligher() {
    document.getElementById("lindy-highlighter")?.remove();
}

function renderHighlighter(highlightRect: DOMRect, quote: string) {
    const container = document.createElement("div");
    container.id = "lindy-highlighter";
    container.style.position = "absolute";
    container.style.top = `${highlightRect.top + highlightRect.height + window.scrollY}px`;
    container.style.left = `${highlightRect.left}px`;
    // container.style.top = `${highlightRect.top + window.scrollY}px`;
    // container.style.left = `${highlightRect.left + highlightRect.width + window.scrollX}px`;

    document.body.appendChild(container);

    new HighlightDetailSvelte({
        target: container,
        props: { quote },
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
    articleSummary: string,
    enablePageView: (reason: string) => void
) {
    const container = document.createElement("div");
    container.id = "lindy-page-card";
    container.style.position = "absolute";
    container.style.top = `10px`;
    container.style.right = `25px`;
    container.style.zIndex = `9999999999`;
    document.body.appendChild(container);

    new ArticleCardSvelte({
        target: container,
        props: { readingTimeMinutes, keyPointsCount, articleSummary, enablePageView },
    });
}
