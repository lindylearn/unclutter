import tinycolor from "tinycolor2";
import { minFontSizePx } from "../../../common/defaultStorage";
import { createStylesheetText } from "../../../common/stylesheets";
import {
    activeColorThemeVariable,
    backgroundColorThemeVariable,
    fontSizeThemeVariable,
    getThemeValue,
    originalBackgroundThemeVariable,
    setCssThemeVariable,
} from "../../../common/theme";
import { PageModifier, trackModifierExecution } from "../_interface";

const globalParagraphSelector = "p, font, pre";

/*
Find and iterate upon text elements and their parent containers in the article DOM.

This is done so that we can:
 - Remove x margin from elements that contain the article text. We then apply a standardized margin on the <body> tag itself.
 - Remove horizontal layouts in elements that contain the article text, and side margin left over from horizontal partitioning.
 - Remove borders, shadows, and background colors from elements that contain article text.
 - Get the current font size of the main text elements.
*/
@trackModifierExecution
export default class TextContainerModifier implements PageModifier {
    // Collect elements that contain text nodes
    private containerSelectors = [];
    // Collect overrides for specific container elements (insert as stylesheet for easy unpatching)
    private overrideCssDeclarations = [];
    // Remember background colors on text containers
    private backgroundColors = [];

    private mainFontSize;
    private exampleMainFontSizeElement;

    async prepare() {
        let paragraphSelector = globalParagraphSelector;
        let paragraphs = document.body.querySelectorAll(paragraphSelector);
        if (paragraphs.length === 0) {
            paragraphSelector = "div, span";
            paragraphs = document.body.querySelectorAll(paragraphSelector);
        }

        const seenNodes = new Set();
        const iterateParents = (elem: HTMLElement) => {
            if (seenNodes.has(elem)) {
                return;
            }

            // Iterate upwards in DOM tree from paragraph node
            let currentElem = elem;
            while (currentElem !== document.body) {
                if (seenNodes.has(currentElem)) {
                    break;
                }
                seenNodes.add(currentElem);

                const currentSelector = _getNodeSelector(currentElem); // this adds a unique additional classname
                this.containerSelectors.push(currentSelector);

                if (currentElem === elem) {
                    // select text containers from first element
                    this.containerSelectors.push(
                        paragraphSelector
                            .split(", ")
                            .map((tag) => `${currentSelector} > ${tag}`)
                            .join(", ")
                    );
                }

                // Perform other style changes based on applied runtime style and DOM structure
                const activeStyle = window.getComputedStyle(currentElem);
                this.overrideCssDeclarations =
                    this.overrideCssDeclarations.concat(
                        _getNodeOverrideStyles(
                            currentElem,
                            currentSelector,
                            activeStyle
                        )
                    );

                if (!_isAsideEquivalent(currentElem)) {
                    // Remember background colors on text containers
                    if (
                        !activeStyle.backgroundColor.includes(
                            "rgba(0, 0, 0, 0)"
                        )
                    ) {
                        console.log(activeStyle.backgroundColor, currentElem);
                        this.backgroundColors.push(activeStyle.backgroundColor);
                    }
                }

                currentElem = currentElem.parentElement;
            }
        };

        const paragraphFontSizes = {};
        const exampleNodePerFontSize = {};
        paragraphs.forEach((elem) => {
            // Ignore invisible nodes
            // Note: iterateDOM is called before content block, so may not catch all hidden nodes (e.g. in footer)
            if (elem.offsetHeight === 0) {
                return;
            }

            const activeStyle = window.getComputedStyle(elem);
            const fontSize = parseFloat(activeStyle.fontSize);
            if (paragraphFontSizes[fontSize]) {
                paragraphFontSizes[fontSize] += 1;
            } else {
                paragraphFontSizes[fontSize] = 1;
                exampleNodePerFontSize[fontSize] = elem;
            }

            iterateParents(elem.parentElement);
        });

        // console.log(`Found font sizes: `, paragraphFontSizes);
        // Just use the most common font size for now
        // Note that the actual font size might be changed by responsive styles
        this.mainFontSize = Object.keys(paragraphFontSizes).reduce(
            (a, b) => (paragraphFontSizes[a] > paragraphFontSizes[b] ? a : b),
            0
        );
        this.exampleMainFontSizeElement =
            exampleNodePerFontSize[this.mainFontSize];
    }

    async fadeOutNoise() {
        this.processBackgroundColors(this.backgroundColors);
    }

    async transitionIn() {
        // Adjust font according to theme
        // TODO scale all font sizes?
        if (this.mainFontSize) {
            this.setTextFontOverride(this.exampleMainFontSizeElement);
        }

        // Removing margin and cleaning up background, shadows etc
        createStylesheetText(
            this.getTextElementChainOverrideStyle(this.containerSelectors),
            "lindy-text-chain-override"
        );

        // Display fixes with visible layout shift (e.g. removing horizontal partitioning)
        createStylesheetText(
            this.overrideCssDeclarations.join("\n"),
            "lindy-node-overrides"
        );
    }

    async transitionOut() {
        document
            .querySelectorAll(
                ".lindy-font-size, .lindy-text-chain-override, .lindy-node-overrides"
            )
            .forEach((e) => e.remove());
    }

    private getTextElementChainOverrideStyle(containerSelectors) {
        // Remove margin from matched paragraphs and all their parent DOM nodes
        const matchedTextSelector = containerSelectors.join(", ");
        return `${matchedTextSelector} {
            width: 100% !important;
            min-width: 0 !important;
            max-width: calc(var(--lindy-pagewidth) - 2 * 40px) !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            transition: margin 0.2s;
        }`;
    }

    private setTextFontOverride(largestElem) {
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

    private processBackgroundColors(textBackgroundColors) {
        // Colors are in reverse-hierarchical order, with ones closest to the text first
        // console.log("Found background colors:", textBackgroundColors);

        // <body> background color was already saved in ${originalBackgroundThemeVariable} in background.js
        const bodyColor = getThemeValue(originalBackgroundThemeVariable);

        // Pick original color from text stack if set, otherwise use body color
        let pickedColor;
        if (textBackgroundColors.length > 0) {
            pickedColor = textBackgroundColors[0];
        } else {
            pickedColor = bodyColor;
        }

        console.log(bodyColor, textBackgroundColors);

        const brightness = tinycolor(pickedColor).getBrightness();
        if (brightness > 230) {
            // too light colors conflict with background
            pickedColor = "white";
        }

        setCssThemeVariable(originalBackgroundThemeVariable, pickedColor, true);

        const themeName = getThemeValue(activeColorThemeVariable);
        if (!themeName || themeName === "auto") {
            setCssThemeVariable(
                backgroundColorThemeVariable,
                pickedColor,
                true
            );
        }
    }
}

const asideWordBlocklist = [
    "header",
    "footer",
    "aside",
    "sidebar",
    "comment",
    "language",
    "banner",
    "alert",
    "message",
];
function _isAsideEquivalent(node) {
    return (
        node.tagName === "HEADER" ||
        node.tagName === "FOOTER" ||
        node.tagName === "ASIDE" ||
        node.tagName === "CODE" ||
        asideWordBlocklist.some(
            (word) =>
                node.className.toLowerCase().includes(word) ||
                node.id.toLowerCase().includes(word)
        ) ||
        node.hasAttribute("data-language")
    );
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
        overrideCssDeclarations.push(
            `${currentSelector} { display: block !important; }`
        );
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
