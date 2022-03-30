import { minFontSizePx } from "../../common/defaultStorage";
import { createStylesheetText } from "./common";
import {
    activeColorThemeVariable,
    backgroundColorThemeVariable,
    fontSizeThemeVariable,
    getThemeValue,
    originalBackgroundThemeVariable,
    setCssThemeVariable,
} from "./theme";

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
    // Remember background colors on text containers
    const backgroundColors = [];

    // Iterate upwards in DOM tree from paragraph node
    let currentElem = largestElem.parentElement;
    while (currentElem !== document.body) {
        // Construct and save element selector
        const siblingSelector = _getSiblingSelector(currentElem);
        if (siblingSelector) {
            containerSelectors.push(siblingSelector);
        }

        const currentSelector = _getNodeSelector(currentElem); // this adds a unique additional classname
        containerSelectors.push(currentSelector);

        // Perform other style changes based on applied runtime style and DOM structure
        const activeStyle = window.getComputedStyle(currentElem);
        overrideCssDeclarations = overrideCssDeclarations.concat(
            _getNodeOverrideStyles(currentElem, currentSelector, activeStyle)
        );

        // Remember background colors on text containers
        if (!activeStyle.backgroundColor.includes("rgba(0, 0, 0, 0)")) {
            backgroundColors.push(activeStyle.backgroundColor);
        }

        currentElem = currentElem.parentElement;
    }

    // Selector for text paragraphs we detected
    const matchedParagraphSelector = globalParagraphSelector
        .split(", ")
        .map((tag) => `${containerSelectors[0]} > ${tag}`)
        .join(", ");

    function fadeOut() {
        _processBackgroundColors(backgroundColors);
    }

    function pageViewTransition() {
        // Adjust font according to theme
        _setTextFontOverride(largestElem);

        // Removing margin and cleaning up background, shadows etc
        createStylesheetText(
            _getTextElementChainOverrideStyle(
                containerSelectors,
                matchedParagraphSelector
            ),
            "lindy-text-chain-override"
        );

        // Display fixes with visible layout shift (e.g. removing horizontal partitioning)
        createStylesheetText(
            overrideCssDeclarations.join("\n"),
            "lindy-node-overrides"
        );
    }

    return [fadeOut, pageViewTransition];
}

// undo pageViewTransition()
export function unPatchDomTransform() {
    document
        .querySelectorAll(
            ".lindy-font-size, .lindy-text-chain-override, .lindy-node-overrides"
        )
        .forEach((e) => e.remove());
}

// Get a CSS selector for the passed node with a high specifity
function _getNodeSelector(node) {
    // Create new unique class
    const containerId = `container_${Math.random().toString().slice(2)}`;
    node.classList.add(containerId); // will only be applied in next loop

    // construct selector in "tag.class[id='id']" format
    const classNames = [containerId].map((className) => `.${className}`);
    const completeSelector = `${node.tagName.toLowerCase()}${classNames.join(
        ""
    )}${node.id ? `[id='${node.id}']` : ""}`;
    return completeSelector;
}
// Get a CSS selector that uses all classes of this element
// Used to select sibling text containers that use the same style
function _getSiblingSelector(node) {
    // only allow valid CSS classnames, e.g. not starting with number
    return [...node.classList]
        .filter((classname) => /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(classname))
        .map((className) => `.${className}`)
        .join("");
}

function _getNodeOverrideStyles(node, currentSelector, activeStyle) {
    const overrideCssDeclarations = [];
    // Remove horizontal flex partitioning
    // e.g. https://www.nationalgeographic.com/science/article/the-controversial-quest-to-make-a-contagious-vaccine
    if (activeStyle.display === "flex" && activeStyle.flexDirection === "row") {
        overrideCssDeclarations.push(`${currentSelector} {
            display: block;
        }`);
        // TODO hide siblings instead
    }

    // Remove grids
    // e.g. https://www.washingtonpost.com/business/2022/02/27/bp-russia-rosneft-ukraine
    // https://www.trickster.dev/post/decrypting-your-own-https-traffic-with-wireshark/
    if (activeStyle.display === "grid") {
        overrideCssDeclarations.push(`${currentSelector} {
            display: block;
            grid-template-columns: 1fr;
            grid-template-areas: none;
            column-gap: 0;
        }`);
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
        min-width: 0 !important;
        max-width: var(--lindy-pagewidth) !important;
        margin-left: auto !important;
        margin-right: auto !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        background: none !important;
        border: none !important;
        box-shadow: none !important;
        transition: all 0.5s;
    }`;
}

function _setTextFontOverride(largestElem) {
    // Base on size of largest text element
    const activeStyle = window.getComputedStyle(largestElem);

    // Set font size to use as CSS variable
    const activeFontSizePx = Math.max(
        parseFloat(activeStyle.fontSize),
        minFontSizePx
    );
    setCssThemeVariable(fontSizeThemeVariable, `${activeFontSizePx}px`);

    // Convert line-height to relative and specify override, in case it was set as px
    // results in NaN if line-height: normal -- which is fine.
    const relativeLineHeight = (
        parseFloat(activeStyle.lineHeight.replace("px", "")) /
        parseFloat(activeStyle.fontSize.replace("px", ""))
    ).toFixed(1);

    const fontSizeStyle = `${globalParagraphSelector} {
        font-size: var(${fontSizeThemeVariable}) !important;
        line-height: ${relativeLineHeight} !important;
    }`;

    // setCssThemeVariable("--lindy-original-font-size", activeStyle.fontSize);
    createStylesheetText(fontSizeStyle, "lindy-font-size");
}

function _processBackgroundColors(textBackgroundColors) {
    // Colors are in reverse-hierarchical order, with ones closest to the text first
    // console.log("Found background colors:", textBackgroundColors);

    // <body> background color was already saved in ${originalBackgroundThemeVariable} in background.js
    const bodyColor = getThemeValue(originalBackgroundThemeVariable);
    // console.log(textBackgroundColors, bodyColor);

    // Pick original color from text stack if set, otherwise use body color
    let pickedColor;
    if (textBackgroundColors.length > 0) {
        pickedColor = textBackgroundColors[0];
    } else {
        pickedColor = bodyColor;
    }
    setCssThemeVariable(originalBackgroundThemeVariable, pickedColor, true);

    const themeName = getThemeValue(activeColorThemeVariable);
    if (!themeName || themeName === "auto") {
        setCssThemeVariable(backgroundColorThemeVariable, pickedColor, true);
    }
}
