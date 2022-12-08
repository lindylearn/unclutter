import AssistantSvelte from "./Assistant.svelte";

export function startAssistant() {
    document.addEventListener("selectstart", onSelectionStart);
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("mouseup", onSelectionDone);

    document.addEventListener("DOMContentLoaded", () => {
        const font = document.createElement("link");
        font.href = "https://fonts.googleapis.com/css2?family=Vollkorn:wght@400&display=swap";
        font.rel = "stylesheet";
        document.head.appendChild(font);
    });
}

function onSelectionStart() {
    document.getElementById("highlighter")?.remove();
}

function onSelectionChange() {}

function onSelectionDone() {
    const selection = document.getSelection();
    const quote = selection.toString();
    if (!quote) {
        return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    renderHighlighter(rect, quote);
}

function renderHighlighter(highlightRect: DOMRect, quote: string) {
    const container = document.createElement("div");
    container.id = "highlighter";
    container.style.position = "absolute";
    container.style.top = `${highlightRect.top + highlightRect.height + window.scrollY}px`;
    container.style.left = `${highlightRect.left}px`;

    document.body.appendChild(container);

    new AssistantSvelte({
        target: container,
        props: { quote },
    });
}
