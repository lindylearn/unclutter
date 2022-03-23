import { createStylesheetText } from "./common";

const globalParagraphSelector = "p, font, pre";

/*
Find and iterate upon text elements and their parent containers in the article DOM.

This is done so that we can:
 - Remove x margin from elements that contain the article text. We then apply a standardized margin on the <body> tag itself.
 - Remove horizontal layouts in elements that contain the article text, and side margin left over from horizontal partitioning.
 - Remove borders, shadows, and background colors from elements that contain article text.
 - Get the current font size of the main text elements.
*/
export default function iterateDOM() {
    let candidates = document.body.querySelectorAll(globalParagraphSelector);
    if (!candidates) {
        candidates = document.body.querySelectorAll("div, span");
    }

    // Get paragraph element with largest text content
    let largestElem = document.body;
    let maxTextLength = 0;
    candidates.forEach((elem) => {
        // Ignore invisible nodes
        if (elem.offsetHeight === 0) {
            return;
        }

        // const nodeText = elem.childNodes[0]?.nodeValue; // text of just this element, not including children
        const nodeText = elem.textContent;
        if (nodeText?.length > maxTextLength) {
            largestElem = elem;
            maxTextLength = nodeText.length;
        }
    });
    console.log(`Largest paragraph element:`, largestElem);

    // Collect elements that contain text nodes
    const containerSelectors = [];
    // Collect overrides for specific container elements (insert as stylesheet for easy unpatching)
    let overrideCssDeclarations = [];

    // Iterate upwards in DOM tree from paragraph node
    let currentElem = largestElem.parentElement;
    while (currentElem !== document.body) {
        // Construct and save element selector
        const currentSelector = _getNodeSelector(currentElem);
        containerSelectors.push(currentSelector);

        // Perform other style changes based on applied runtime style and DOM structure
        const activeStyle = window.getComputedStyle(currentElem);
        overrideCssDeclarations = overrideCssDeclarations.concat(
            _getNodeOverrideStyles(currentElem, currentSelector, activeStyle)
        );

        // TODO parse and pass-up text background
        // if (!activeStyle.background.includes("rgba(0, 0, 0, 0)")) {
        //     console.log(activeStyle.background);
        // }

        currentElem = currentElem.parentElement;
    }

    // Selector for text paragraphs we detected
    const matchedParagraphSelector = globalParagraphSelector
        .split(", ")
        .map((tag) => `${containerSelectors[0]} > ${tag}`)
        .join(", ");

    // Insert override styles
    createStylesheetText(
        overrideCssDeclarations.join("\n"),
        "lindy-node-overrides"
    );
    createStylesheetText(
        _getTextElementChainOverrideStyle(
            containerSelectors,
            matchedParagraphSelector
        ),
        "lindy-text-chain-override"
    );

    _setTextFontOverride(largestElem);
}

// Get a CSS selector for the passed node with a high specifity
function _getNodeSelector(node) {
    // Create new unique class
    const containerId = `container_${Math.random().toString().slice(2)}`;
    node.classList.add(containerId); // will only be applied in next loop

    // ...currentElem.classList,
    // // only allow valid CSS classnames, e.g. not starting with number
    // .filter((classname) =>
    //     /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(classname)
    // )

    // construct selector in "tag.class[id='id']" format
    const classNames = [containerId].map((className) => `.${className}`);
    const completeSelector = `${node.tagName.toLowerCase()}${classNames.join(
        ""
    )}${node.id ? `[id='${node.id}']` : ""}`;
    return completeSelector;
}

function _getNodeOverrideStyles(node, currentSelector, activeStyle) {
    const overrideCssDeclarations = [];
    // Remove horizontal partitioning
    // e.g. https://www.nationalgeographic.com/science/article/the-controversial-quest-to-make-a-contagious-vaccine
    if (activeStyle.display === "flex" && activeStyle.flexDirection === "row") {
        overrideCssDeclarations.push(`${currentSelector} {
                display: block;
            }`);
        // TODO hide siblings instead
    }

    return overrideCssDeclarations;
}

function _getTextElementChainOverrideStyle(
    containerSelectors,
    matchedParagraphSelector
) {
    // Remove margin from matched paragraphs and all their parent DOM nodes
    const matchedTextSelector = containerSelectors
        .concat([matchedParagraphSelector])
        .join(", ");
    return `${matchedTextSelector} {
        width: 100% !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        background: none !important;
        border: none !important;
        box-shadow: none !important;
    }`;
}

function _setTextFontOverride(largestElem) {
    // Base on size of largest text element
    const activeStyle = window.getComputedStyle(largestElem);

    // Convert line-height to relative and specify override, in case it was set as px
    // results in NaN if line-height: normal -- which is fine.
    const relativeLineHeight = (
        parseFloat(activeStyle.lineHeight.replace("px", "")) /
        parseFloat(activeStyle.fontSize.replace("px", ""))
    ).toFixed(1);

    const fontSizeStyle = `${globalParagraphSelector} {
        font-size: var(--lindy-active-font-size) !important;
        line-height: ${relativeLineHeight} !important;
    }`;

    document.body.style.setProperty(
        "--lindy-original-font-size",
        activeStyle.fontSize
    );
    document.body.style.setProperty(
        "--lindy-active-font-size",
        activeStyle.fontSize
    );
    createStylesheetText(fontSizeStyle, "lindy-font-size");
}
