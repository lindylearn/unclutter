import { getDomain } from "@unclutter/library-components/dist/common/util";
import { setUserSettingsForDomain } from "../../common/storage";
import SmartHighlightsModifier, {
    RelatedHighlight,
    RankedSentence,
} from "../../content-script/modifications/DOM/smartHighlights";
import HighlightDetailSvelte from "./HighlightDetail.svelte";
import ArticleBadgeSvelte from "./ArticleBadge.svelte";

export function renderHighlightsLayer(enablePageView: () => void, enhanceActive: boolean) {
    // document.addEventListener("mousedown", onSelectionStart);
    // document.addEventListener("mouseup", onSelectionDone);
    // document.addEventListener("contextmenu", removeHighligher);

    document.addEventListener("mouseup", (event) => {
        const target = event.target as HTMLElement;
        if (!target.classList.contains("lindy-smart-highlight-absolute")) {
            removeHighligher();
        }
    });

    function onHighlightClick(range: Range, related: RelatedHighlight[]) {
        // enablePageView();

        removeHighligher();
        const rect = range.getBoundingClientRect();
        const quote = range.toString();
        renderHighlighter(rect, quote, related);
    }
    const smartHighlightsModifier = new SmartHighlightsModifier(onHighlightClick);

    if (enhanceActive) {
        // TODO move to shared fn (same as below)
        smartHighlightsModifier.isProxyActive = true;
        smartHighlightsModifier.enableHighlightsClick = true;
        smartHighlightsModifier.enableScrollBar = false;
    } else {
        const font = document.createElement("link");
        font.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@500&display=swap";
        // &family=Work+Sans:wght@400
        font.rel = "stylesheet";
        document.head.appendChild(font);

        smartHighlightsModifier.enableStyleTweaks();
    }

    function preparePageView() {
        // disable scrollbar for reader mode
        smartHighlightsModifier.disableStyleTweaks();
        smartHighlightsModifier.disableScrollbar();

        // handle clicks on highlights in enhance.ts
        smartHighlightsModifier.isProxyActive = true;

        // enable click layer on next re-paint
        smartHighlightsModifier.enableHighlightsClick = true;

        // scrollbar not supported yet
        smartHighlightsModifier.enableScrollBar = false;
    }
    function enablePageViewInner() {
        preparePageView();
        enablePageView();
    }
    smartHighlightsModifier.parseUnclutteredArticle().then((isArticle) => {
        if (isArticle && !enhanceActive) {
            renderArticleBadge(
                smartHighlightsModifier.keyPointsCount,
                smartHighlightsModifier.relatedCount,
                smartHighlightsModifier.disableAnnotations.bind(smartHighlightsModifier),
                enablePageViewInner
            );
        }
    });

    return preparePageView;
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

function renderArticleBadge(
    keyPointsCount: number,
    relatedCount: number,
    disableAnnotations: () => void,
    enablePageView: () => void
) {
    const container = document.createElement("div");
    container.id = "lindy-article-badge";
    document.documentElement.appendChild(container);

    new ArticleBadgeSvelte({
        target: container.attachShadow({ mode: "open" }),
        props: {
            keyPointsCount,
            relatedCount,
            enablePageView: () => {
                // anchor on left edge to prevent jump on scrollbar insert
                const rect = container.getBoundingClientRect();
                container.style.setProperty("left", `${rect.left}px`, "important");
                container.style.setProperty("right", "unset", "important");

                enablePageView();
            },
            disableHighlightslayer: () => {
                container.remove();
                disableAnnotations();

                const domain = getDomain(window.location.href);
                setUserSettingsForDomain(domain, "deny");
            },
        },
    });
}
