import { createStylesheetText } from "../../../common/stylesheets";
import { fontSizeThemeVariable } from "../../../common/theme";
import { cleanTitle } from "../../../overlay/outline/parse";
import { PageModifier, trackModifierExecution } from "../_interface";

export const lindyContainerClass = "lindy-text-container";
export const lindyHeadingContainerClass = "lindy-heading-container";
export const lindyImageContainerClass = "lindy-image-container";

export const lindyMainContentContainerClass = "lindy-main-text-container";
export const lindyMainHeaderContainerClass = "lindy-main-header-container";
export const lindyFirstMainContainerClass = "lindy-first-main-container";

const globalTextElementSelector = "p, font, pre";
const globalHeadingSelector = "h1, h2, h3, h4, header";
const headingClassWordlist = ["heading", "title", "article-details"]; // be careful here
const globalImageSelector = "img, picture, figure";

const headingTags = globalHeadingSelector.split(", ");

// DOM elements that contain more than this fraction of the entire page text will never be removed
// by the ContentBlockModifier, and their style will be cleaned up more strictly.
const mainContentFractionThreshold = 0.4; // 0.47 on https://www.whichev.net/2022/03/29/theion-sulphur-crystal-batteries-promise-breakthrough-in-energy-density/
// Skip the main text detection if the page contains less than these number of chars
const mainContentMinLength = 500; // 205 on https://huggingface.co/spaces/loubnabnl/code-generation-models

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
    // Chain of elements that contain the main article text, to remove margins from
    private bodyContainerSelector = [
        // Use class twice for higher specifity
        `.${lindyContainerClass}.${lindyContainerClass}`,
        // also select paragraph children
        `.${lindyContainerClass} > :is(${globalTextElementSelector}, ${globalHeadingSelector})`,
    ].join(",");

    // Only text elements, e.g. to apply font changes
    private textElementSelector = `.${lindyContainerClass}, .${lindyContainerClass} > :is(${globalTextElementSelector}, a, ol, ul)`;

    // style tweaks to apply just before the pageview animation (populated via _prepareBeforeAnimationPatches())
    private nodeBeforeAnimationStyle: [
        HTMLElement,
        { marginLeft?: string; maxWidth?: string }
    ][] = [];

    // Remember background colors on text containers
    private backgroundColors = [];

    // Text paragraph samples
    private mainFontSize: number;
    public mainTextColor: string;
    private exampleMainFontSizeElement: HTMLElement;

    // Iterate DOM to apply text container classes and populate the state above
    public foundMainContentElement = false;
    public foundMainHeadingElement = false;
    private bodyContentLength: number;
    async prepare() {
        this.bodyContentLength = document.body.innerText.length;
        if (this.bodyContentLength < mainContentMinLength) {
            // set large number so all fractions are small -> foundMainContentElement stays false
            this.bodyContentLength = 1000000;
        }

        // Apply to text nodes
        let textElements = document.body.querySelectorAll(
            globalTextElementSelector
        );
        if (textElements.length === 0) {
            // use divs as fallback
            // TODO change textElementSelector now?
            textElements = document.body.querySelectorAll("div, span");
        }
        textElements.forEach((elem: HTMLElement) => {
            this.processElement(elem, "text");
        });

        // Apply to heading nodes
        this.validatedNodes = new Set(); // reset phase-internal state
        document.body
            .querySelectorAll(globalHeadingSelector)
            .forEach((elem: HTMLElement) => {
                this.processElement(elem, "header");
            });
        this.headingParagraphNodes.forEach((elem: HTMLElement) => {
            this.processElement(elem, "header");
        });

        // search images
        this.validatedNodes = new Set();
        document.body
            .querySelectorAll(globalImageSelector)
            .forEach((elem: HTMLElement) => {
                this.processElement(elem, "image");
            });

        // Just use the most common font size for now
        // Note that the actual font size might be changed by responsive styles
        this.mainFontSize = Object.keys(this.paragraphFontSizes).reduce(
            (a, b) =>
                this.paragraphFontSizes[a] > this.paragraphFontSizes[b] ? a : b,
            0
        );
        this.exampleMainFontSizeElement =
            this.exampleNodePerFontSize[this.mainFontSize];
        if (this.exampleMainFontSizeElement) {
            this.mainTextColor = window.getComputedStyle(
                this.exampleMainFontSizeElement
            ).color;
        }

        // batch className changes to only do one reflow
        this.batchedNodeClassAdditions.map(([node, className]) => {
            node.classList.add(className);
        });
    }

    // Process text or heading elements and iterate upwards
    private paragraphFontSizes: { [size: number]: number } = {};
    private exampleNodePerFontSize: { [size: number]: HTMLElement } = {};
    private processElement = (
        elem: HTMLElement,
        elementType: "text" | "header" | "image"
    ) => {
        // Ignore invisible nodes
        // Note: iterateDOM is called before content block, so may not catch all hidden nodes (e.g. in footer)
        if (elem.offsetHeight === 0) {
            return;
        }

        const activeStyle = window.getComputedStyle(elem);

        if (elementType === "text") {
            // exclude small text nodes
            if (elem.innerText.length < 60) {
                return;
            }

            // parse text element font size
            const fontSize = parseFloat(activeStyle.fontSize);
            if (this.paragraphFontSizes[fontSize]) {
                this.paragraphFontSizes[fontSize] += 1;

                // Save largest element as example (small paragraphs might have header-specific line height)
                if (
                    elem.innerText.length >
                    this.exampleNodePerFontSize[fontSize].innerText.length
                ) {
                    this.exampleNodePerFontSize[fontSize] = elem;
                }
            } else {
                this.paragraphFontSizes[fontSize] = 1;
                this.exampleNodePerFontSize[fontSize] = elem;
            }
        }

        // iterate parents
        if (elementType === "header" || elementType === "image") {
            // apply modifications to heading elements themselves to prevent them being hidden
            this.prepareIterateParents(elem, elementType, activeStyle);
        } else {
            this.prepareIterateParents(
                elem.parentElement,
                elementType,
                activeStyle
            );
        }

        this._prepareBeforeAnimationPatches(elem, activeStyle);
    };

    private validatedNodes: Set<HTMLElement> = new Set(); // nodes processed in the current phase of prepareIterateParents()
    private mainStackElements: Set<HTMLElement> = new Set(); // nodes that have the main text or header container class applied
    // add all classes at once to prevent multiple reflows
    private batchedNodeClassAdditions: [HTMLElement, string][] = [];
    private headingParagraphNodes: HTMLElement[] = [];
    private cleanPageTitle = cleanTitle(document.title)
        .slice(0, 30)
        .toLowerCase();

    // map paragraphs nodes and iterate their parent nodes
    private prepareIterateParents = (
        elem: HTMLElement,
        stackType: "text" | "header" | "image",
        activeStyle: CSSStyleDeclaration
    ) => {
        if (this.validatedNodes.has(elem)) {
            return;
        }

        // calls for headings happen after text elements -> mark entire stack as heading later

        // Iterate upwards in DOM tree from paragraph node
        let currentElem = elem;
        let currentStack: HTMLElement[] = [];
        while (currentElem !== document.documentElement) {
            if (
                this.mainStackElements.has(currentElem) ||
                // don't go into parents if already validated them (only for text containers since their mainStack state doesn't change for parents)
                (stackType === "text" && this.validatedNodes.has(currentElem))
            ) {
                break;
            }

            // TODO re-add big related content detection
            // if (
            //     !isHeadingStack &&
            //     this.shouldExcludeAsTextContainer(currentElem)
            // ) {
            //     // remove entire current stack
            //     return;
            // }

            // exclude image captions
            if (
                stackType !== "image" &&
                ["FIGURE", "PICTURE"].includes(currentElem.tagName)
            ) {
                return;
            }

            // make node as processed only if valid text container to also abort future stacks
            this.validatedNodes.add(currentElem);

            // handle text elements that are part of headings
            if (stackType === "text") {
                if (
                    headingTags.includes(currentElem.tagName.toLowerCase()) ||
                    headingClassWordlist.some((word) =>
                        currentElem.className.toLowerCase().includes(word)
                    )
                ) {
                    // double check to exclude matches on main text containers
                    // e.g. on https://pharmaphorum.com/views-and-analysis/how-celebrity-investor-mark-cuban-is-tackling-out-of-control-drug-prices/
                    const pageContentFraction =
                        elem.innerText.length / this.bodyContentLength;

                    if (!(pageContentFraction > mainContentFractionThreshold)) {
                        // handle heading nodes later, after all text containers are assigned
                        this.headingParagraphNodes.push(elem);
                        return;
                    }
                }
            }

            // iterate upwards
            currentStack.push(currentElem);
            currentElem = currentElem.parentElement;
        }

        let isMainStack = false; // main stack determined based on leaf elements for headings, based on intermediate parent size for text elements

        // check element position
        if (
            (stackType === "header" || stackType === "image") &&
            currentStack.length > 0
        ) {
            // for headings check tagName, content & if on first page
            // this should exclude heading elements that are part of "related articles" sections
            const pos = elem.getBoundingClientRect(); // TODO measure performance
            const top = pos.top + window.scrollY;

            if (stackType === "header") {
                const isOnFirstPage = top < window.innerHeight && top >= 0;
                // hidden above page e.g. for https://www.city-journal.org/san-francisco-recalls-da-chesa-boudin

                // base main stack state on leaf element
                isMainStack =
                    isOnFirstPage &&
                    !elem.className.includes("blog") &&
                    (elem.tagName === "H1" ||
                        elem.innerText
                            .toLowerCase()
                            .includes(this.cleanPageTitle));
                if (isMainStack) {
                    this.foundMainHeadingElement = true;
                    this.batchedNodeClassAdditions.push([
                        elem,
                        lindyFirstMainContainerClass,
                    ]);
                }
            } else if (stackType === "image") {
                // protect large images at start of article
                // e.g. just below fold on https://spectrum.ieee.org/commodore-64
                const isOnFirstPage = top < window.innerHeight * 2;
                if (!isOnFirstPage || pos.height < 300) {
                    return;
                }
            }
        }

        // perform modifications on valid text element stack
        for (const elem of currentStack) {
            const activeStyle = window.getComputedStyle(elem);

            // check if element is main text or header
            if (
                stackType === "text" &&
                !isMainStack &&
                elem !== document.body
            ) {
                // for text containers, consider the fraction of the page text
                const pageContentFraction =
                    elem.innerText.length / this.bodyContentLength;

                isMainStack =
                    pageContentFraction > mainContentFractionThreshold;

                if (isMainStack) {
                    this.batchedNodeClassAdditions.push([
                        elem,
                        lindyFirstMainContainerClass,
                    ]);

                    this.foundMainContentElement = true;
                }
            }

            // parse background color from main text element stacks
            if (isMainStack && stackType === "text") {
                if (
                    // don't take default background color
                    !activeStyle.backgroundColor.includes("rgba(0, 0, 0, 0)") &&
                    // don't consider transparent colors
                    !activeStyle.backgroundColor.includes("0.") &&
                    !activeStyle.backgroundColor.includes("%") &&
                    activeStyle.position !== "fixed"
                ) {
                    // Remember background colors on text containers
                    // console.log(activeStyle.backgroundColor, elem);
                    this.backgroundColors.push(activeStyle.backgroundColor);
                }
            }

            // save classes to add
            if (stackType === "header") {
                this.batchedNodeClassAdditions.push([
                    elem,
                    lindyHeadingContainerClass,
                ]);
                if (isMainStack && elem !== document.body) {
                    this.batchedNodeClassAdditions.push([
                        elem,
                        lindyMainHeaderContainerClass,
                    ]);
                }
            } else if (stackType === "text") {
                this.batchedNodeClassAdditions.push([
                    elem,
                    lindyContainerClass,
                ]);
                if (isMainStack) {
                    this.batchedNodeClassAdditions.push([
                        elem,
                        lindyMainContentContainerClass,
                    ]);
                }
            } else if (stackType === "image") {
                this.batchedNodeClassAdditions.push([
                    elem,
                    lindyImageContainerClass,
                ]);
            }

            // apply override classes (but not text container) e.g. for text elements on theatlantic.com
            this._getNodeOverrideClasses(elem, activeStyle).map((className) =>
                this.batchedNodeClassAdditions.push([elem, className])
            );
            this._prepareBeforeAnimationPatches(elem, activeStyle);

            if (isMainStack) {
                // skip processing in next iteration phase (respect main text elems when checking headers)
                this.mainStackElements.add(elem);
            }
        }
    };

    fadeOutNoise() {
        this.processBackgroundColors();
    }

    afterTransitionIn() {
        // changing text style often seems to break animation, so do after transition

        // Removing margin and cleaning up background, shadows etc
        createStylesheetText(
            this.getTextElementChainOverrideStyle(),
            "lindy-text-chain-override"
        );
    }

    prepareTransitionOut() {
        this.nodeBeforeAnimationStyle.map(
            ([node, { marginLeft, maxWidth }]) => {
                node.style.setProperty(
                    "transition",
                    "margin-left 0.4s cubic-bezier(0.33, 1, 0.68, 1)"
                );
            }
        );
    }

    transitionOut() {
        document
            .querySelectorAll(".lindy-text-chain-override")
            .forEach((e) => e.remove());
    }

    afterTransitionOut() {
        document
            .querySelectorAll(".lindy-font-size, .lindy-node-overrides")
            .forEach((e) => e.remove());
    }

    prepareAnimation() {
        // should leave text in same place as before, but positioned animation-friendly using left margins

        this.nodeBeforeAnimationStyle.map(
            ([node, { marginLeft, maxWidth }]) => {
                if (marginLeft) {
                    node.style.setProperty("margin-left", marginLeft);
                }
                if (maxWidth) {
                    // node.style.setProperty("width", "100%");
                    node.style.setProperty("max-width", maxWidth);
                }

                // e.g. xkcd.com
                node.style.setProperty("left", "0");
            }
        );

        // Display fixes with visible layout shift (e.g. removing horizontal partitioning)
        createStylesheetText(
            this.overrideCssDeclarations.join("\n"),
            "lindy-text-node-overrides"
        );
    }

    private getTextElementChainOverrideStyle() {
        // Remove margin from matched paragraphs and all their parent DOM nodes
        return `
            /* clean up all page text containers */
            ${
                this.bodyContainerSelector
            }, .${lindyHeadingContainerClass}.${lindyHeadingContainerClass}.${lindyHeadingContainerClass} {
                width: 100% !important;
                min-width: 0 !important;
                min-height: 0 !important;
                max-width: calc(var(--lindy-pagewidth) - 2 * 50px) !important;
                max-height: none !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                border: none !important;
                background: none !important;
                box-shadow: none !important;
                z-index: 1 !important;
                transition: margin-left 0.4s cubic-bezier(0.33, 1, 0.68, 1);
            }
            /* clean up headings */
            .${lindyHeadingContainerClass}.${lindyHeadingContainerClass}.${lindyHeadingContainerClass}:not(body), .${lindyHeadingContainerClass} > * {
                color: black !important;

                position: relative !important;
                top: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                height: auto !important;
                transform: none !important;
            }
            .${lindyHeadingContainerClass}:before, .${lindyHeadingContainerClass}:after {
                display: none !important;
            }
            .${lindyMainHeaderContainerClass}.${lindyMainHeaderContainerClass} {
                margin: 0 !important;
                padding: 0 !important;
            }
            .${lindyHeadingContainerClass} a {
                color: black !important;
            }

            .${lindyImageContainerClass} {
                margin: 0 !important;
                padding: 0 !important;
            }

            /* block non-container siblings of main containers, but don't apply to first main container to not block images etc */
            .${lindyMainContentContainerClass}:not(.${lindyFirstMainContainerClass}) > :not(.${lindyMainContentContainerClass}, .${lindyImageContainerClass},
                 .${
                     this.foundMainHeadingElement
                         ? lindyMainHeaderContainerClass
                         : lindyHeadingContainerClass
                 }) {
                display: none !important;
            }
            /* more strict cleanup for contains of the main page text */
            .${lindyMainContentContainerClass}.${lindyMainContentContainerClass}:not(body) {
                border: solid 1px none !important;
                position: relative !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                top: 0 !important;
            }
        `;
    }

    // set text color variable only when dark mode enabled, otherwise overwrites color (even if css var not set)
    public setTextDarkModeVariable(darkModeEnabled: boolean) {
        if (!darkModeEnabled) {
            document
                .querySelectorAll(".lindy-dark-mode-text")
                .forEach((e) => e.remove());
            return;
        }

        const css = `${this.bodyContainerSelector}, .${lindyHeadingContainerClass}.${lindyHeadingContainerClass}.${lindyHeadingContainerClass}.${lindyHeadingContainerClass}, .${lindyHeadingContainerClass} > * {
            color: var(--lindy-dark-theme-text-color) !important;
        }`;
        createStylesheetText(css, "lindy-dark-mode-text");
    }

    private relativeLineHeight: string;
    private fontSizeNormalizationScale: number = 1;
    measureFontProperties() {
        if (!this.exampleMainFontSizeElement) {
            return;
        }

        const activeStyle = window.getComputedStyle(
            this.exampleMainFontSizeElement
        );

        // Convert line-height to relative and specify override in case it was set as px
        if (activeStyle.lineHeight.includes("px")) {
            this.relativeLineHeight = (
                parseFloat(activeStyle.lineHeight.replace("px", "")) /
                parseFloat(activeStyle.fontSize.replace("px", ""))
            ).toFixed(2);
        } else {
            this.relativeLineHeight = activeStyle.lineHeight;
        }

        // Measure size of font x-height (height of lowercase chars)
        const measureDiv = document.createElement("div");
        measureDiv.innerText = "x";
        measureDiv.style.margin = "0";
        measureDiv.style.padding = "0";
        measureDiv.style.fontSize = "20px";
        measureDiv.style.height = "1ex";
        measureDiv.style.lineHeight = "0";
        measureDiv.style.visibility = "hidden";
        measureDiv.style.contain = "strict";

        this.exampleMainFontSizeElement.style.contain = "layout style paint";
        this.exampleMainFontSizeElement.appendChild(measureDiv);

        const xHeight = measureDiv.getBoundingClientRect().height;
        measureDiv.remove();
        this.exampleMainFontSizeElement.style.removeProperty("contain");

        this.fontSizeNormalizationScale = 1;
        if (xHeight && xHeight !== 0) {
            this.fontSizeNormalizationScale = 10 / xHeight;
        }
    }

    // Adjust main font according to theme
    setTextFontOverride() {
        const fontSize = `calc(var(${fontSizeThemeVariable}) * ${this.fontSizeNormalizationScale.toFixed(
            2
        )})`;
        const fontSizeStyle = `${this.textElementSelector} {
            position: relative !important;
            font-size: ${fontSize} !important;
            line-height: ${this.relativeLineHeight} !important;
        }`;

        // setCssThemeVariable("--lindy-original-font-size", activeStyle.fontSize);
        createStylesheetText(fontSizeStyle, "lindy-font-size");
    }

    public originalBackgroundColor: string;
    private processBackgroundColors() {
        if (
            this.backgroundColors.length > 0 &&
            this.backgroundColors[0] !== "rgba(0, 0, 0, 0)"
        ) {
            this.originalBackgroundColor = this.backgroundColors[0];
        }
    }

    // Collect overrides for specific container elements (insert as stylesheet for easy unpatching)
    private overrideCssDeclarations = [
        // hide sidebar siblings, e.g. on https://www.thespacereview.com/article/4384/1
        `.${lindyContainerClass} > td:not(.${lindyContainerClass}) { 
                display: none !important;
            }`,
        // Remove grids, e.g. https://www.washingtonpost.com/business/2022/02/27/bp-russia-rosneft-ukraine or https://www.trickster.dev/post/decrypting-your-own-https-traffic-with-wireshark/
        `.lindy-text-remove-grid { 
                display: block !important;
                grid-template-columns: 1fr !important;
                grid-template-areas: none !important;
                column-gap: 0 !important;
            }`,
        // TODO add classes to siblings to improve selector performance
        // `.lindy-text-remove-grid > *:not(.${lindyContainerClass}) {
        //     display: none !important;
        // }`,
    ];

    // Get classes from overrideCssDeclarations to apply to a certain node
    private _getNodeOverrideClasses(
        node: HTMLElement,
        activeStyle: CSSStyleDeclaration
    ): string[] {
        // batch creation of unique node selectors if required
        const classes = [];

        if (activeStyle.display === "grid") {
            classes.push("lindy-text-remove-grid");
        }

        return classes;
    }

    // prepare changes to apply before animating the pageview entry
    // reading this later would trigger another reflow
    private _prepareBeforeAnimationPatches(
        node: HTMLElement,
        activeStyle: CSSStyleDeclaration
    ) {
        const beforeAnimationProperties: any = {};

        const nodeBox = node.getBoundingClientRect();
        const parentBox = node.parentElement.getBoundingClientRect();
        const parentStyle = window.getComputedStyle(node.parentElement);

        // activeStyle.marginLeft returns concrete values for "auto" -- use this to make margin animation work
        // use x offset to parent instead of margin to handle grid & flex layouts which we remove with #lindy-text-node-override
        const leftOffset = nodeBox.left - parentBox.left;
        if (leftOffset !== 0) {
            const parentPadding = parseFloat(
                window
                    .getComputedStyle(node.parentElement)
                    .paddingLeft.replace("px", "")
            );

            beforeAnimationProperties.marginLeft = `${
                leftOffset - parentPadding
            }px`;
        }

        // flex and grid layouts are removed via _getNodeOverrideClasses() above, so set max-width on children to retain width without siblings
        if (
            (parentStyle.display === "flex" &&
                parentStyle.flexDirection === "row") ||
            parentStyle.display === "grid"
        ) {
            beforeAnimationProperties.maxWidth = `${nodeBox.width}px`;
        }

        if (Object.keys(beforeAnimationProperties).length > 0) {
            this.nodeBeforeAnimationStyle.push([
                node,
                beforeAnimationProperties,
            ]);
        }
    }

    // very carefully exclude elements as text containers
    // used to avoid incorrect main container selection for small articles
    // this doesn't mean these elements will be removed, but they might
    private shouldExcludeAsTextContainer(node: HTMLElement) {
        return false;

        // causes issues on https://news.illinois.edu/view/6367/913924091
        if (["UL", "OL"].includes(node.tagName)) {
            const contentLength = node.innerText.length;
            const pageContentFraction = contentLength / this.bodyContentLength;

            // abort for very large <ul> related articles section, e.g on https://ca.finance.yahoo.com/news/mining-ukraine-ports-may-months-162909326.html?guccounter=1
            // but allow small lists in the text
            if (pageContentFraction > 0.1) {
                return true;
            }
        }

        return false;
    }
}
