import { createStylesheetText } from "../../../common/stylesheets";
import { fontSizeThemeVariable } from "../../../common/theme";
import { blockedClasses, blockedWords } from "../contentBlock";
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
    private textParagraphSelectors = [];
    // Collect overrides for specific container elements (insert as stylesheet for easy unpatching)
    private overrideCssDeclarations = [];
    // Remember background colors on text containers
    private backgroundColors = [];

    private mainFontSize: number;
    private exampleMainFontSizeElement: HTMLElement;

    constructor() {}

    async prepare() {
        let paragraphTagSelector = globalParagraphSelector;
        let paragraphs = document.body.querySelectorAll(paragraphTagSelector);
        if (paragraphs.length === 0) {
            paragraphTagSelector = "div, span";
            paragraphs = document.body.querySelectorAll(paragraphTagSelector);
        }

        const textTagSelectors = globalParagraphSelector
            .split(", ")
            .concat("a", "ol", "blockquote") // also apply to these, but don't parse style from them
            .map((tag) => `.${lindyTextContainerClass} > ${tag}`);

        // text elements to apply styles to (e.g. font change)
        this.textParagraphSelectors = [
            // Use class twice for higher specifity
            `.${lindyTextContainerClass}.${lindyTextContainerClass}`,
            // exclude h1 tags
            ...textTagSelectors,
        ];
        // text element container to remove margin from
        this.containerSelectors = [
            `.${lindyTextContainerClass}.${lindyTextContainerClass}`,
            ...textTagSelectors,
        ];

        const validatedNodes: Set<HTMLElement> = new Set();
        const iterateParents = (elem: HTMLElement) => {
            if (validatedNodes.has(elem)) {
                return;
            }

            // Iterate upwards in DOM tree from paragraph node
            let currentElem = elem;
            let currentStack: HTMLElement[] = [];
            while (currentElem !== document.body) {
                // don't go into parents if validated they're ok
                if (validatedNodes.has(currentElem)) {
                    break;
                }

                if (_isAsideEquivalent(currentElem)) {
                    // console.log(
                    //     `Found aside equivalent text container:`,
                    //     currentElem
                    // );

                    // remove entire current stack
                    currentStack = [];
                    break;
                }

                // we processed this node, even if we may not end up taking it
                validatedNodes.add(currentElem);

                // iterate upwards
                currentStack.push(currentElem);
                currentElem = currentElem.parentElement;
            }

            // perform modifications if is valid text element stack
            if (currentStack.length !== 0) {
                for (const elem of currentStack) {
                    // Perform other style changes based on applied runtime style and DOM structure
                    const activeStyle = window.getComputedStyle(elem);

                    // note: may not catch bacbkground url(), e.g. on https://www.bunniestudios.com/blog/?p=6375
                    // maybe some color is fine?

                    if (
                        // exlude some classes from background changes but not text adjustments
                        !backgroundWordBlockList.some((word) =>
                            elem.className.toLowerCase().includes(word)
                        ) &&
                        // don't take default background color
                        !activeStyle.backgroundColor.includes(
                            "rgba(0, 0, 0, 0)"
                        ) &&
                        // don't consider transparent colors
                        !activeStyle.backgroundColor.includes("0.") &&
                        !activeStyle.backgroundColor.includes("%")
                    ) {
                        // Remember background colors on text containers
                        // console.log(activeStyle.backgroundColor, elem);
                        this.backgroundColors.push(activeStyle.backgroundColor);
                    }

                    // enable text changes only after getting background color
                    elem.classList.add(lindyTextContainerClass);
                    const overrideStyles = _getNodeOverrideStyles(
                        elem,
                        activeStyle
                    );
                    if (overrideStyles) {
                        this.overrideCssDeclarations.push(overrideStyles);
                    }
                }
            }
        };

        const paragraphFontSizes: { [size: number]: number } = {};
        const exampleNodePerFontSize: { [size: number]: HTMLElement } = {};
        paragraphs.forEach((elem: HTMLElement) => {
            // Ignore invisible nodes
            // Note: iterateDOM is called before content block, so may not catch all hidden nodes (e.g. in footer)
            if (elem.offsetHeight === 0) {
                return;
            }

            const activeStyle = window.getComputedStyle(elem);
            const fontSize = parseFloat(activeStyle.fontSize);
            if (paragraphFontSizes[fontSize]) {
                paragraphFontSizes[fontSize] += 1;

                // Save largest element as example (small paragraphs might have header-specific line height)
                if (
                    elem.innerText.length >
                    exampleNodePerFontSize[fontSize].innerText.length
                ) {
                    exampleNodePerFontSize[fontSize] = elem;
                }
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

    fadeOutNoise() {
        this.processBackgroundColors(this.backgroundColors);
    }

    transitionIn() {
        // Adjust font according to theme
        // TODO scale all font sizes?
        if (this.mainFontSize) {
            this.setTextFontOverride(this.exampleMainFontSizeElement);
        }
    }

    afterTransitionIn() {
        // changing text style often seems to break animation, so do after transition

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

    // set text color variable only when dark mode enabled, otherwise overwrites color (even if css var not set)
    public setTextDarkModeVariable(darkModeEnabled: boolean) {
        if (!darkModeEnabled) {
            document
                .querySelectorAll(".lindy-dark-mode-text")
                .forEach((e) => e.remove());
            return;
        }

        const matchedTextSelector = this.containerSelectors.join(", ");
        const css = `${matchedTextSelector} {
            color: var(--lindy-dark-theme-text-color);
        }`;
        createStylesheetText(css, "lindy-dark-mode-text");
    }

    private setTextFontOverride(largestElem) {
        const activeStyle = window.getComputedStyle(largestElem);

        // Measure size of font 'ex' x-height (height of lowercase chars)
        const measureDiv = document.createElement("div");
        measureDiv.innerText = "x";
        measureDiv.style.margin = "0";
        measureDiv.style.padding = "0";
        measureDiv.style.fontSize = "20px";
        measureDiv.style.height = "1ex";
        measureDiv.style.lineHeight = "0";
        measureDiv.style.visibility = "hidden";

        largestElem.appendChild(measureDiv);
        const xHeight = measureDiv.getBoundingClientRect().height;
        let fontSizeNormalizationScale = 1;
        if (xHeight && xHeight !== 0) {
            fontSizeNormalizationScale = 10 / xHeight;
        }
        measureDiv.remove();

        // Convert line-height to relative and specify override in case it was set as px
        let relativeLineHeight: string;
        if (activeStyle.lineHeight.includes("px")) {
            relativeLineHeight = (
                parseFloat(activeStyle.lineHeight.replace("px", "")) /
                parseFloat(activeStyle.fontSize.replace("px", ""))
            ).toFixed(2);
        } else {
            relativeLineHeight = activeStyle.lineHeight;
        }
        const fontSizeStyle = `${this.textParagraphSelectors.join(", ")} {
            font-size: calc(var(${fontSizeThemeVariable}) * ${fontSizeNormalizationScale.toFixed(
            2
        )}) !important;
            line-height: ${relativeLineHeight} !important;
        }`;

        // setCssThemeVariable("--lindy-original-font-size", activeStyle.fontSize);
        createStylesheetText(fontSizeStyle, "lindy-font-size");
    }

    public originalBackgroundColor: string;
    private processBackgroundColors(textBackgroundColors) {
        // Colors are in reverse-hierarchical order, with ones closest to the text first
        // console.log("Found background colors:", textBackgroundColors);

        // Pick original color from text stack if set, otherwise use body color
        let pickedColor: string;
        if (textBackgroundColors.length > 0) {
            pickedColor = textBackgroundColors[0];
        } else {
            pickedColor = window.getComputedStyle(
                document.body
            ).backgroundColor;

            if (pickedColor.includes("rgba(0, 0, 0, 0)")) {
                pickedColor = "white";
            }
        }

        this.originalBackgroundColor = pickedColor;
    }
}

const lindyTextContainerClass = "lindy-text-container";

// classes to exclude text changes from
// more strict than blockedWords
export const asideWordBlocklist = [
    "header",
    "footer",
    "aside",
    "sidebar",
    "comment",
    "language",
    "banner",
    "alert",
    "message",
    "dialog",
    "nav",
    "menu",
    "privacy",
    "consent",
    "cookies",
    "overlay",
    "popup",
    "caption",
    "gallery",
    // "ad", may easily occur in auto-generated ids
    "newsletter",
    "promo",
    "composer",
    "callout",
];

function _isAsideEquivalent(node: HTMLElement) {
    return (
        node.tagName === "HEADER" ||
        node.tagName === "FOOTER" ||
        node.tagName === "ASIDE" ||
        node.tagName === "CODE" ||
        blockedClasses.includes(node.className) ||
        asideWordBlocklist
            .concat(blockedWords)
            .some(
                (word) =>
                    node.className.toLowerCase().includes(word) ||
                    node.id.toLowerCase().includes(word)
            ) ||
        node.hasAttribute("data-language") ||
        isSupportBanner(node)
    );
}

// these are just excluded from changing their backgrund color
const backgroundWordBlockList = [
    "lede", // https://cockpit-project.org/
    "frontpage", // https://cockpit-project.org/
];

// be very careful here to not match valid text nodes
function isSupportBanner(node: HTMLElement): boolean {
    const firstChild = node.firstChild as HTMLElement;
    if (!firstChild || !firstChild.tagName?.startsWith("H")) {
        // short circuit
        return false;
    }

    // e.g. https://psyche.co/guides/how-to-have-a-life-full-of-wonder-and-learning-about-the-world
    if (node.textContent?.startsWith("Support")) {
        return true;
    }
}

// Get a CSS selector for the passed node with a high specifity
function _getUniqueNodeSelector(node) {
    // Create new unique class
    const containerId = `lindy-text-container_${Math.random()
        .toString()
        .slice(2)}`;
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

// Perform various tweaks to containers if required
function _getNodeOverrideStyles(node, activeStyle) {
    const overrideCssDeclarations = [];
    // Remove horizontal flex partitioning
    // e.g. https://www.nationalgeographic.com/science/article/the-controversial-quest-to-make-a-contagious-vaccine
    if (activeStyle.display === "flex" && activeStyle.flexDirection === "row") {
        overrideCssDeclarations.push(`display: block !important;`);
        // careful to not overwrite content block, e.g. aside on https://www.quantamagazine.org/father-son-team-solves-geometry-problem-with-infinite-folds-20220404/
        // TODO hide siblings instead
    }

    // Remove grids
    // e.g. https://www.washingtonpost.com/business/2022/02/27/bp-russia-rosneft-ukraine
    // https://www.trickster.dev/post/decrypting-your-own-https-traffic-with-wireshark/
    if (activeStyle.display === "grid") {
        overrideCssDeclarations.push(`
            display: block !important;
            grid-template-columns: 1fr !important;
            grid-template-areas: none !important;
            column-gap: 0 !important;
        `);
    }

    if (node.tagName === "TD") {
        // hide sidebar siblings, e.g. on https://www.thespacereview.com/article/4384/1

        const siblings: HTMLElement[] = [
            ...node.parentElement.childNodes,
        ].filter((child) => child !== node);

        siblings.map((sibling) => {
            if (sibling.style) {
                sibling.style.display = "none";
            }
        });
    }

    if (overrideCssDeclarations.length > 0) {
        const uniqueSelector = _getUniqueNodeSelector(node);
        return `${uniqueSelector} { ${overrideCssDeclarations.join("\n")} }`;
    } else {
        return null;
    }
}
