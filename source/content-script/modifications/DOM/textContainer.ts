import { createStylesheetText } from "../../../common/stylesheets";
import { fontSizeThemeVariable } from "../../../common/theme";
import { asideWordBlocklist, blockedSpecificSelectors } from "../contentBlock";
import { PageModifier, trackModifierExecution } from "../_interface";

const globalTextElementSelector = "p, font, pre";
const globalHeadingSelector = "header, h1, h2, h3, h4";

const headingTags = globalHeadingSelector.split(", ");

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
    // Only text elements, e.g. to apply font changes
    private textElementSelector = `.${lindyTextContainerClass}, .${lindyTextContainerClass} > :is(${globalTextElementSelector}, a, ol)`;

    // Chain of elements that contain the main article text, to remove margins from
    private bodyContainerSelector = [
        // Use class twice for higher specifity
        `.${lindyContainerClass}.${lindyContainerClass}`,
        // also select paragraph children
        `.${lindyContainerClass} > :is(${globalTextElementSelector}, ${globalHeadingSelector})`,
    ].join(",");

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
    async prepare() {
        // Process text or heading elements and iterate upwards
        const paragraphFontSizes: { [size: number]: number } = {};
        const exampleNodePerFontSize: { [size: number]: HTMLElement } = {};
        const processElement = (
            elem: HTMLElement,
            isTextElement: boolean = false
        ) => {
            // Ignore invisible nodes
            // Note: iterateDOM is called before content block, so may not catch all hidden nodes (e.g. in footer)
            if (elem.offsetHeight === 0) {
                return;
            }

            const activeStyle = window.getComputedStyle(elem);

            if (isTextElement) {
                // parse text element font size
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
            }

            // iterate parents
            this.prepareIterateParents(elem.parentElement);

            // apply override classes (but not text container) e.g. for text elements on theatlantic.com
            this._getNodeOverrideClasses(elem, activeStyle).map((className) =>
                this.batchedNodeClassAdditions.push([elem, className])
            );
            this._prepareBeforeAnimationPatches(elem, activeStyle);
        };

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
            processElement(elem, true);
        });

        // Apply to heading nodes
        document.body
            .querySelectorAll(globalHeadingSelector)
            .forEach((elem: HTMLElement) => {
                processElement(elem, false);
            });

        // Just use the most common font size for now
        // Note that the actual font size might be changed by responsive styles
        this.mainFontSize = Object.keys(paragraphFontSizes).reduce(
            (a, b) => (paragraphFontSizes[a] > paragraphFontSizes[b] ? a : b),
            0
        );
        this.exampleMainFontSizeElement =
            exampleNodePerFontSize[this.mainFontSize];
        this.mainTextColor = window.getComputedStyle(
            this.exampleMainFontSizeElement
        ).color;

        // batch className changes to only do one reflow
        this.batchedNodeClassAdditions.map(([node, className]) => {
            node.classList.add(className);
        });
    }

    // map paragraphs nodes and iterate their parent nodes
    private validatedNodes: Set<HTMLElement> = new Set();
    // add all classes at once to prevent multiple reflows
    private batchedNodeClassAdditions: [HTMLElement, string][] = [];
    private prepareIterateParents = (elem: HTMLElement) => {
        if (this.validatedNodes.has(elem)) {
            return;
        }

        // Iterate upwards in DOM tree from paragraph node
        let currentElem = elem;
        let currentStack: [HTMLElement, boolean][] = [];
        while (currentElem !== document.documentElement) {
            // don't go into parents if validated they're ok
            if (this.validatedNodes.has(currentElem)) {
                break;
            }

            if (_isAsideEquivalent(currentElem)) {
                // remove entire current stack
                // console.log(
                //     `Found aside container:`,
                //     currentElem
                // );
                currentStack = [];
                break;
            }

            const isHeading =
                headingTags.includes(currentElem.tagName.toLowerCase()) ||
                headingWordlist.some((word) =>
                    currentElem.className.toLowerCase().includes(word)
                );
            if (isHeading) {
                // mark current stack elements as heading (parents might not be)
                // console.log(`Found heading container:`, currentElem);
                currentStack = currentStack.map(([elem, _]) => [elem, true]);
            }

            // we processed this node, even if we may not end up taking it
            this.validatedNodes.add(currentElem);

            // iterate upwards
            currentStack.push([currentElem, isHeading]);
            currentElem = currentElem.parentElement;
        }

        // perform modifications if is valid text element stack
        if (currentStack.length !== 0) {
            for (const [elem, isHeading] of currentStack) {
                const activeStyle = window.getComputedStyle(elem);

                if (!isHeading) {
                    // parse background color
                    if (
                        // exlude some classes from background changes but not text adjustments
                        !backgroundWordBlockList.some(
                            (word) =>
                                elem.className.toLowerCase().includes(word) ||
                                elem.id.toLowerCase().includes(word)
                        ) &&
                        // don't take default background color
                        !activeStyle.backgroundColor.includes(
                            "rgba(0, 0, 0, 0)"
                        ) &&
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

                this.batchedNodeClassAdditions.push([
                    elem,
                    lindyContainerClass,
                ]);
                if (isHeading) {
                    this.batchedNodeClassAdditions.push([
                        elem,
                        lindyHeadingContainerClass,
                    ]);
                } else {
                    this.batchedNodeClassAdditions.push([
                        elem,
                        lindyTextContainerClass,
                    ]);
                }

                this._getNodeOverrideClasses(elem, activeStyle).map(
                    (className) =>
                        this.batchedNodeClassAdditions.push([elem, className])
                );
                this._prepareBeforeAnimationPatches(elem, activeStyle);
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
            ${this.bodyContainerSelector} {
                width: 100% !important;
                min-width: 0 !important;
                min-height: 0 !important;
                max-width: calc(var(--lindy-pagewidth) - 2 * 50px) !important;
                max-height: none !important;
                margin-left: 1px !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                background: none !important;
                box-shadow: none !important;
                z-index: 1 !important;
                transition: margin-left 0.4s cubic-bezier(0.33, 1, 0.68, 1);
            }
            .${lindyHeadingContainerClass}, .${lindyContainerClass}:first-child {
                margin-top: 0 !important;
                padding-top: 0 !important;
                height: auto !important;
            }
            .${lindyTextContainerClass}.${lindyTextContainerClass} {
                border: 1px gray solid !important;
            }
            .${lindyHeadingContainerClass}.${lindyHeadingContainerClass} {
                border: 1px yellow solid !important;
            }
            .${lindyContainerClass} > :is(${globalHeadingSelector}) {
                border: 1px green solid !important;
            }
            .${lindyContainerClass} > :is(${globalTextElementSelector}) {
                border: 1px red solid !important;
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

        const css = `${this.bodyContainerSelector} {
            color: var(--lindy-dark-theme-text-color);
        }`;
        createStylesheetText(css, "lindy-dark-mode-text");
    }

    private relativeLineHeight: string;
    private fontSizeNormalizationScale: number;
    measureFontProperties() {
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
            position: relative;
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
        `.lindy-container > td:not(.lindy-container) { 
                display: none !important;
            }`,
        // Remove horizontal flex partitioning, e.g. https://www.nationalgeographic.com/science/article/the-controversial-quest-to-make-a-contagious-vaccine, https://hbr.org/2018/07/research-the-average-age-of-a-successful-startup-founder-is-45
        `.lindy-text-remove-horizontal-flex { display: block !important; }`,
        `.lindy-text-remove-horizontal-flex > div:not(.lindy-container) { display: none !important; }`,
        // Remove grids, e.g. https://www.washingtonpost.com/business/2022/02/27/bp-russia-rosneft-ukraine or https://www.trickster.dev/post/decrypting-your-own-https-traffic-with-wireshark/
        `.lindy-text-remove-grid { 
                display: block !important;
                grid-template-columns: 1fr !important;
                grid-template-areas: none !important;
                column-gap: 0 !important;
            }`,
        // TODO add classes to siblings to improve selector performance
        // `.lindy-text-remove-grid > *:not(.lindy-container) {
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

        if (
            activeStyle.display === "flex" &&
            activeStyle.flexDirection === "row"
        ) {
            classes.push("lindy-text-remove-horizontal-flex");
        }

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
}

export const lindyContainerClass = "lindy-container";
export const lindyTextContainerClass = "lindy-text-container";
export const lindyHeadingContainerClass = "lindy-heading-container";

const headingWordlist = ["heading", "title"];

function _isAsideEquivalent(node: HTMLElement) {
    if (node === document.body || node.tagName === "ARTICLE") {
        return false;
    }

    return (
        node.tagName === "FOOTER" ||
        node.tagName === "ASIDE" ||
        node.tagName === "CODE" ||
        node.tagName === "NAV" ||
        // leave quotes as is, e.g. https://stratechery.com/2022/why-netflix-should-sell-ads/
        node.tagName === "BLOCKQUOTE" ||
        node.tagName === "CODE" ||
        blockedSpecificSelectors.includes(node.className) ||
        asideWordBlocklist.some(
            (word) =>
                node.className.toLowerCase().includes(word) ||
                node.id.toLowerCase().includes(word)
        ) ||
        node.hasAttribute("data-language")
        // isSupportBanner(node) // false positive on https://www.eurogamer.net/dead-space-creators-the-callisto-protocol-has-ditched-ties-with-pubg-universe
    );
}

// these are just excluded from changing their backgrund color
const backgroundWordBlockList = [
    "lede", // https://cockpit-project.org/
    "frontpage", // https://cockpit-project.org/
    "details", // https://www.gamesindustry.biz/articles/2022-05-20-games-account-for-32-percent-of-tencents-usd2-13-billion-q1-revenues
    "header",
    "sidebar",
    "dialog",
    "call-to-action", // https://future.a16z.com/the-future-of-search-is-boutique/
    "overlay",
    "alert",
];

// be very careful here to not match valid text nodes
const supportBannerTextStart = [
    "Support", // https://psyche.co/guides/how-to-have-a-life-full-of-wonder-and-learning-about-the-world
    "Don't Miss", // https://www.military.com/history/how-naked-skydive-inspired-way-keep-pilots-oriented-flight.html
];
function isSupportBanner(node: HTMLElement): boolean {
    const firstChild = node.firstElementChild as HTMLElement;

    if (!firstChild || !firstChild.tagName?.startsWith("H")) {
        // short circuit
        return false;
    }

    const text = node.textContent.trim();
    if (
        text &&
        supportBannerTextStart.some((start) => text.startsWith(start))
    ) {
        return true;
    }

    return false;
}

// Get a CSS selector for the passed node with a high specifity
function _getUniqueNodeSelector(node) {
    // Create new unique class
    const containerId = `lindy-container_${Math.random().toString().slice(2)}`;
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
