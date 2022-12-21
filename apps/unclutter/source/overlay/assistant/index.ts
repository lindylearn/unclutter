import SmartHighlightsModifier from "../../content-script/modifications/DOM/smartHighlights";
import AssistantSvelte from "./Assistant.svelte";

export function startAssistant() {
    // document.addEventListener("mousedown", onSelectionStart);
    // document.addEventListener("mouseup", onSelectionDone);
    // document.addEventListener("contextmenu", removeHighligher);
    document.addEventListener("mouseup", (event) => {
        const target = event.target as HTMLElement;
        if (!target.classList.contains("lindy-smart-highlight-absolute")) {
            removeHighligher();
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const wordCount = document.body.innerText.trim().split(/\s+/).length;
        if (wordCount < 200 * 2) {
            console.log("Ignoring likely non-article page");
            return;
        }

        function onHighlightClick(range: Range) {
            removeHighligher();

            const rect = range.getBoundingClientRect();
            const quote = range.toString();
            renderHighlighter(rect, quote);
        }
        const smartHighlightsModifier = new SmartHighlightsModifier(
            null,
            // @ts-ignore
            { usedTextElementSelector: "p, font, li" },
            true,
            onHighlightClick
        );
        smartHighlightsModifier.parseArticle();

        const font = document.createElement("link");
        font.href = "https://fonts.googleapis.com/css2?family=Vollkorn:wght@400&display=swap";
        font.rel = "stylesheet";
        document.head.appendChild(font);
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
    document.getElementById("highlighter")?.remove();
}

function renderHighlighter(highlightRect: DOMRect, quote: string) {
    const container = document.createElement("div");
    container.id = "highlighter";
    container.style.position = "absolute";
    container.style.top = `${highlightRect.top + highlightRect.height + window.scrollY}px`;
    container.style.left = `${highlightRect.left}px`;
    // container.style.top = `${highlightRect.top + window.scrollY}px`;
    // container.style.left = `${highlightRect.left + highlightRect.width + window.scrollX}px`;

    document.body.appendChild(container);

    new AssistantSvelte({
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
