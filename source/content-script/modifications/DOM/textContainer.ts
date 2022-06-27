import { pxToNumber } from "../../../common/css";
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

const globalTextElementSelector = "p, font";
const globalHeadingSelector =
    "h1, h2, h3, h4, header, [class*='head' i], [class*='title' i]";
const headingClassWordlist = ["header", "heading", "title", "article-details"]; // be careful here
const globalImageSelector = "img, picture, figure, video";

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
    private cleanPageTitle = cleanTitle(document.title)
        .slice(0, 15) // match only beginning
        .toLowerCase();

    private usedTextElementSelector: string = globalTextElementSelector; // may get updated if page uses different html elements

    private inlineStyleTweaks: [HTMLElement, Partial<CSSStyleDeclaration>][] =
        [];

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
    async iterateDom() {
        this.bodyContentLength = document.body.innerText.length;
        if (this.bodyContentLength < mainContentMinLength) {
            // set large number so all fractions are small -> foundMainContentElement stays false
            this.bodyContentLength = 1000000;
        }

        // Apply to text nodes
        let validTextNodeCount = 0;
        document.body
            .querySelectorAll(globalTextElementSelector)
            .forEach((elem: HTMLElement) => {
                if (this.processElement(elem, "text")) {
                    validTextNodeCount += 1;
                }
            });

        // try with div fallback selector (more performance intensive)
        if (validTextNodeCount < 5) {
            // e.g. using div as text containers on https://www.apple.com/newsroom/2022/06/apple-unveils-all-new-macbook-air-supercharged-by-the-new-m2-chip/
            console.log("Using div as text elem selector");

            document.body
                .querySelectorAll("div")
                .forEach((elem: HTMLElement) => {
                    this.processElement(elem, "text");
                });
            this.usedTextElementSelector = `${globalTextElementSelector}, div`;
        }

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
        // @ts-ignore
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

        this.animationLayerCandidates.push([
            document.body,
            {
                nodeBox: document.body.getBoundingClientRect(),
                stackType: "text",
            },
        ]);
    }

    assignClassnames() {
        // batch className changes to only do one reflow
        this.nodeClasses.forEach((classes, node) => {
            node.classList.add(...classes);
        });

        // apply first-main class to all candidates, as often detects multiple
        this.firstMainTextContainerCandidates.map((elem) => {
            elem.classList.add(lindyFirstMainContainerClass);
        });
        this.firstMainHeaderCandidates.map((elem) => {
            elem.classList.add(lindyFirstMainContainerClass);
            // use parent elem as first header element to not block siblings
            elem.parentElement.classList.add(lindyFirstMainContainerClass);
        });

        this.watchElementClassnames();
    }

    // Process text or heading elements and iterate upwards
    private paragraphFontSizes: { [size: number]: number } = {};
    private exampleNodePerFontSize: { [size: number]: HTMLElement } = {};
    private processElement(
        elem: HTMLElement,
        elementType: "text" | "header" | "image"
    ): boolean {
        // Ignore invisible nodes
        // Note: iterateDOM is called before content block, so may not catch all hidden nodes (e.g. in footer)
        if (elem.offsetHeight === 0) {
            return false;
        }

        const activeStyle = window.getComputedStyle(elem);

        if (elementType === "text") {
            let textContentLength: number;
            if (elem.tagName === "DIV") {
                // use only direct node text to start iteration at leaf nodes
                textContentLength = [...elem.childNodes]
                    .filter((node) => node.nodeType === Node.TEXT_NODE)
                    .map((node) => node.nodeValue)
                    .join("").length;
            } else {
                textContentLength = elem.innerText.length;
            }
            // exclude small text nodes
            if (textContentLength < 50) {
                return false;
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

        // iterate parent containers (don't start with elem for text containers)
        const iterationStart =
            elementType === "header" || elementType === "image"
                ? elem
                : elem.parentElement;
        const hasValidTextChain = this.prepareIterateParents(
            iterationStart,
            elementType
        );

        // check all leaf nodes if should create layer
        const nodeBox = elem.getBoundingClientRect();
        this.checkShouldCreateAnimationLayer(elem, elementType, nodeBox, true);

        return hasValidTextChain;
    }

    // iteration state
    private validatedNodes: Set<HTMLElement> = new Set(); // nodes processed in the current phase of prepareIterateParents()
    private mainStackElements: Set<HTMLElement> = new Set(); // nodes that have the main text or header container class applied
    private headingParagraphNodes: HTMLElement[] = [];

    // DOM changes to perform (batched to avoid multiple reflows)
    private nodeClasses: Map<HTMLElement, string[]> = new Map();
    private firstMainTextContainerCandidates: HTMLElement[] = [];
    private firstMainHeaderCandidates: HTMLElement[] = [];

    // map paragraphs nodes and iterate their parent nodes
    private prepareIterateParents(
        startElem: HTMLElement,
        stackType: "text" | "header" | "image"
    ): boolean {
        // calls for headings happen after text elements -> mark entire stack as heading later

        // Iterate upwards in DOM tree from paragraph node
        let currentElem = startElem;
        let currentStack: HTMLElement[] = [];
        while (currentElem !== document.body) {
            if (
                this.mainStackElements.has(currentElem) ||
                // don't go into parents if already validated them (only for text containers since their mainStack state doesn't change for parents)
                (stackType === "text" && this.validatedNodes.has(currentElem))
            ) {
                // process stack until now
                break;
            }

            if (
                stackType === "text" &&
                this.shouldExcludeAsTextContainer(currentElem)
            ) {
                // remove entire current stack
                return false;
            }

            // exclude image captions
            if (
                stackType !== "image" &&
                ["FIGURE", "PICTURE"].includes(currentElem.tagName)
            ) {
                return false;
            }

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
                        currentElem.innerText.length / this.bodyContentLength;

                    if (!(pageContentFraction > mainContentFractionThreshold)) {
                        // handle heading nodes later, after all text containers are assigned
                        this.headingParagraphNodes.push(startElem);
                        return false;
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
            const pos = startElem.getBoundingClientRect(); // TODO measure performance
            const top = pos.top + window.scrollY;

            const isOnFirstPage = top < window.innerHeight * 2 && top >= 0;
            // hidden above page e.g. for https://www.city-journal.org/san-francisco-recalls-da-chesa-boudin
            // e.g. just below fold on https://spectrum.ieee.org/commodore-64

            if (stackType === "header") {
                const linkElem =
                    startElem.parentElement.tagName === "A"
                        ? startElem.parentElement
                        : startElem.firstElementChild;

                // main stack state determined by leaf element
                isMainStack =
                    isOnFirstPage &&
                    (linkElem?.tagName !== "A" ||
                        linkElem.href === window.location.href) &&
                    ((startElem.tagName === "H1" &&
                        startElem.innerText?.length >= 15) ||
                        startElem.innerText
                            ?.slice(0, 30)
                            .toLowerCase()
                            .includes(this.cleanPageTitle));

                if (isMainStack) {
                    this.foundMainHeadingElement = true;
                    this.firstMainHeaderCandidates.push(startElem);
                }
            } else if (stackType === "image") {
                if (!isOnFirstPage || pos.height < 250) {
                    return false;
                }
            }
        }

        // perform modifications on valid text element stack
        for (const currentElem of currentStack) {
            const activeStyle = window.getComputedStyle(currentElem);

            // abort based on activeStyle (leaves children behind, but better than nothing)
            if (
                activeStyle.visibility === "hidden" ||
                activeStyle.opacity === "0"
            ) {
                return false;
            }

            // check if element is main text or header
            if (
                stackType === "text" &&
                !isMainStack &&
                currentElem !== document.body
            ) {
                // for text containers, consider the fraction of the page text
                const pageContentFraction =
                    currentElem.innerText.length / this.bodyContentLength;

                isMainStack =
                    pageContentFraction > mainContentFractionThreshold;
                if (isMainStack) {
                    this.foundMainContentElement = true;
                    this.firstMainTextContainerCandidates.push(currentElem);
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
            const currentNodeClasses: string[] = [];
            if (stackType === "header") {
                currentNodeClasses.push(lindyHeadingContainerClass);
                if (isMainStack && currentElem !== document.body) {
                    currentNodeClasses.push(lindyMainHeaderContainerClass);
                }
            } else if (stackType === "text") {
                currentNodeClasses.push(lindyContainerClass);
                if (isMainStack) {
                    currentNodeClasses.push(lindyMainContentContainerClass);
                }
            } else if (stackType === "image") {
                currentNodeClasses.push(lindyImageContainerClass);
            }

            // apply override classes (but not text container) e.g. for text elements on theatlantic.com
            const overrideClasses = this._getNodeOverrideClasses(
                currentElem,
                activeStyle,
                stackType,
                isMainStack
            );
            currentNodeClasses.push(...overrideClasses);

            this.nodeClasses.set(currentElem, [
                ...(this.nodeClasses.get(currentElem) || []),
                ...currentNodeClasses,
            ]);

            const nodeBox = currentElem.getBoundingClientRect();
            this.prepareInlineStyleTweaks(currentElem, stackType, nodeBox);

            // creating layers for some container elements creates better results in case we don't detect all content elements
            this.checkShouldCreateAnimationLayer(
                currentElem,
                stackType,
                nodeBox,
                false
            );

            this.validatedNodes.add(currentElem); // add during second iteration to ignore aborted stacks
            if (isMainStack) {
                // skip processing in next iteration phase (respect main text elems when checking headers)
                this.mainStackElements.add(currentElem);
            }
        }

        return true;
    }

    applyContainerStyles() {
        // Removing margin and cleaning up background, shadows etc
        createStylesheetText(
            this.getTextElementChainOverrideStyle(),
            "lindy-text-chain-override"
        );

        this.inlineStyleTweaks.forEach(([elem, style]) => {
            for (const [key, value] of Object.entries(style)) {
                elem.style.setProperty(key, `${value}`, "important");
            }
        });

        // Display fixes with visible layout shift (e.g. removing horizontal partitioning)
        createStylesheetText(
            this.overrideCssDeclarations.join("\n"),
            "lindy-text-node-overrides"
        );
    }

    // remove container styles that don't break the layout faster
    removeOverrideStyles() {
        document
            .querySelectorAll(
                "#lindy-text-node-overrides, #lindy-font-size, #lindy-dark-mode-text"
            )
            .forEach((e) => e.remove());

        this.inlineStyleTweaks.forEach(([elem, style]) => {
            for (const [key, value] of Object.entries(style)) {
                elem.style.removeProperty(key);
            }
        });
    }

    removeContainerStyles() {
        this.classNamesObserver.disconnect();

        document
            .querySelectorAll("#lindy-text-chain-override")
            .forEach((e) => e.remove());

        this.animationLayerTransforms.map(([node, { scaleX }]) => {
            node.style.removeProperty("transition");
            node.style.removeProperty("transform");
            node.style.removeProperty("left");
            node.style.removeProperty("display");
            node.style.removeProperty("transform-origin");

            // keep will-change
        });
    }

    private getTextElementChainOverrideStyle() {
        // :not(#fakeID#fakeID) used to override stubborn site styles
        return `
            /* clean up all text containers */
            .${lindyContainerClass}:not(#fakeID#fakeID),
            .${lindyHeadingContainerClass}:not(#fakeID#fakeID),
            .${lindyContainerClass}:not(#fakeID#fakeID) > :is(
                ${this.usedTextElementSelector}, 
                ${globalHeadingSelector}
            ) {
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
                overflow: visible !important;
            }
            /* more strict cleanup for main text containers */
            .${lindyMainContentContainerClass}:not(#fakeID#fakeID):not(body) {
                position: relative !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                top: 0 !important;
            }

            /* clean up headings */
            .${lindyHeadingContainerClass}:not(#fakeID#fakeID):not(body), 
            .${lindyHeadingContainerClass}:not(#fakeID#fakeID) > * {
                color: black !important;
                background: none !important;
                -webkit-text-fill-color: unset !important;
                text-shadow: none !important;
                box-shadow: none !important;

                position: relative !important;
                top: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                height: auto;
                float: none !important;
            }
            /* heading style tweaks */
            .${lindyHeadingContainerClass}:before, 
            .${lindyHeadingContainerClass}:after {
                display: none !important;
            }
            .${lindyHeadingContainerClass}:first-child, .${lindyMainHeaderContainerClass} {
                margin-top: 0 !important;
                padding-top: 0 !important;
                margin-bottom: 0 !important;
            }
            .${lindyHeadingContainerClass}:not(#fakeID#fakeID) a {
                color: black !important;
                background: none !important;
            }

            /* image container cleanup */
            .${lindyImageContainerClass}:not(#fakeID#fakeID) {
                width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                border: none !important;
                /* y padding often used to make space for images, e.g. on theintercept or variety.com */
                /* height causes issues for image spacers, e.g. on arstechnica.com */
                backdrop-filter: none !important; /* prevent implicit GPU layer */

                top: 0 !important;
                left: 0 !important;
            }
        `;
    }

    // block siblings of main text containers
    enableSiblingBlock() {
        /* hide sidebar siblings, e.g. on https://www.thespacereview.com/article/4384/1 or http://www.paulgraham.com/think.html */
        const css = `.${lindyMainContentContainerClass}:not(.${lindyFirstMainContainerClass}) > :not(
            .${lindyMainContentContainerClass}, 
            .${lindyImageContainerClass}, 
            .${
                this.foundMainHeadingElement
                    ? lindyMainHeaderContainerClass
                    : lindyHeadingContainerClass
            }
        ) {
            display: none !important;
        }
        .${lindyContainerClass} > td:not(.${lindyContainerClass}) { 
            display: none !important;
        }
        `;
        createStylesheetText(css, "lindy-text-sibling-block");
    }

    fadeInSiblings() {
        const css = `.${lindyMainContentContainerClass}:not(.${lindyFirstMainContainerClass}) > :not(
            .${lindyMainContentContainerClass}, 
            .${lindyImageContainerClass}, 
            .${
                this.foundMainHeadingElement
                    ? lindyMainHeaderContainerClass
                    : lindyHeadingContainerClass
            }
        ) {
            animation-duration: 0.3s;
            animation-name: fadeInFromNone;
        }
        @keyframes fadeInFromNone {
            0% {
                opacity: 0;
            }
            1% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }`;
        createStylesheetText(css, "lindy-text-sibling-fade-in");

        document
            .querySelectorAll("#lindy-text-sibling-block")
            .forEach((e) => e.remove());
    }

    // set text color variable only when dark mode enabled, otherwise overwrites color (even if css var not set)
    setTextDarkModeVariable(darkModeEnabled: boolean) {
        if (!darkModeEnabled) {
            document
                .querySelectorAll(".lindy-dark-mode-text")
                .forEach((e) => e.remove());
            return;
        }

        const css = `
            .${lindyContainerClass}:not(#fakeID#fakeID#fakeID), 
            .${lindyContainerClass}:not(#fakeID#fakeID#fakeID) > :is(${this.usedTextElementSelector}, .${globalHeadingSelector}),
            .${lindyHeadingContainerClass}:not(#fakeID#fakeID#fakeID), 
            .${lindyHeadingContainerClass}:not(#fakeID#fakeID#fakeID) > * {
                color: var(--lindy-dark-theme-text-color) !important;
            }
            .${lindyHeadingContainerClass}:not(#fakeID#fakeID#fakeID) a {
                color: var(--lindy-dark-theme-text-color) !important;
            }
            `;
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
                pxToNumber(activeStyle.lineHeight) /
                pxToNumber(activeStyle.fontSize)
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
        const fontSizeStyle = `.${lindyContainerClass}, .${lindyContainerClass} > :is(${this.usedTextElementSelector}, a, ol, ul) {
            position: relative !important;
            font-size: ${fontSize} !important;
            line-height: ${this.relativeLineHeight} !important;
        }`;

        // setCssThemeVariable("--lindy-original-font-size", activeStyle.fontSize);
        createStylesheetText(fontSizeStyle, "lindy-font-size");
    }

    public originalBackgroundColor: string;
    processBackgroundColors() {
        if (
            this.backgroundColors.length > 0 &&
            this.backgroundColors[0] !== "rgba(0, 0, 0, 0)"
        ) {
            this.originalBackgroundColor = this.backgroundColors[0];
        }
    }

    // Collect overrides for specific container elements (insert as stylesheet for easy unpatching)
    private overrideCssDeclarations = [
        // Remove horizontal flex partitioning, e.g. https://www.nationalgeographic.com/science/article/the-controversial-quest-to-make-a-contagious-vaccine
        `.lindy-text-remove-horizontal-flex { display: block !important; }`,
        // Remove grids, e.g. https://www.washingtonpost.com/business/2022/02/27/bp-russia-rosneft-ukraine or https://www.trickster.dev/post/decrypting-your-own-https-traffic-with-wireshark/
        `.lindy-text-remove-grid { 
            display: block !important;
            grid-template-columns: 1fr !important;
            grid-template-areas: none !important;
            column-gap: 0 !important;
        }`,
        `.lindy-header-font-size-max {
            font-size: 50px !important;
            line-height: 1em !important;
        }`,
        ...["margin-top", "margin-bottom", "padding-top", "padding-bottom"].map(
            (property) => `.lindy-clean-${property}:not(#fakeID#fakeID#fakeID) {
            ${property}: 10px !important;
        }`
        ),
    ];

    // Get classes from overrideCssDeclarations to apply to a certain node
    private _getNodeOverrideClasses(
        node: HTMLElement,
        activeStyle: CSSStyleDeclaration,
        stackType: "text" | "header" | "image",
        isMainStack: boolean
    ): string[] {
        // batch creation of unique node selectors if required
        const classes = [];

        if (
            (stackType === "text" || (stackType === "header" && isMainStack)) &&
            activeStyle.display === "flex" &&
            activeStyle.flexDirection === "row"
        ) {
            classes.push("lindy-text-remove-horizontal-flex");
        }

        if (stackType === "header" && activeStyle.fontSize > "50px") {
            // put maximum on header font size
            // e.g. WP template uses 6em on https://blog.relyabilit.ie/the-curse-of-systems-thinkers/
            classes.push("lindy-header-font-size-max");
        }

        if (stackType === "header" || stackType === "image") {
            [
                "margin-top",
                "margin-bottom",
                "padding-top",
                "padding-bottom",
            ].map((property) => {
                const value = activeStyle.getPropertyValue(property);
                const valueFloat = parseFloat(value.replace("px", ""));

                if (value.startsWith("-")) {
                    classes.push(`lindy-clean-${property}`);
                    return;
                }

                if (
                    valueFloat >= 60 &&
                    (stackType !== "image" ||
                        valueFloat < node.scrollHeight * 0.9)
                ) {
                    // remove large margins (e.g. on https://progressive.org/magazine/bipartisan-rejection-school-choice-bryant/)
                    // skip this if margin contributes >= 90% of an image's height (e.g. on https://www.cnbc.com/2022/06/20/what-is-staked-ether-steth-and-why-is-it-causing-havoc-in-crypto.html)

                    classes.push(`lindy-clean-${property}`);
                    return;
                }
            });
        }

        if (activeStyle.display === "grid") {
            classes.push("lindy-text-remove-grid");
        }

        return classes;
    }

    private prepareInlineStyleTweaks(
        node: HTMLElement,
        stackType: string,
        nodeBox: DOMRect
    ) {
        const styleTweaks: Partial<CSSStyleDeclaration> = {};
        const parentStyle = window.getComputedStyle(node.parentElement);

        // flex and grid layouts are removed via _getNodeOverrideClasses() above, so save max-width on children to retain width without siblings
        if (
            (parentStyle.display === "flex" &&
                parentStyle.flexDirection === "row") ||
            parentStyle.display === "grid"
        ) {
            styleTweaks["max-width"] = `${nodeBox.width}px`;
        }

        if (Object.keys(styleTweaks).length > 0) {
            this.inlineStyleTweaks.push([node, styleTweaks]);
        }
    }

    // stage elements to put on animation layers, with their original page position
    // know actual parent layers for each layer only once content block done
    private animationLayerCandidates: [
        HTMLElement,
        { stackType: string; nodeBox: DOMRect }
    ][] = [];
    private checkShouldCreateAnimationLayer(
        node: HTMLElement,
        stackType: string,
        nodeBox: DOMRect,
        isLeafElement: boolean
    ) {
        // only animate elements in (or above) viewport for performance
        if (nodeBox.top > window.scrollY + window.innerHeight * 1.5) {
            return;
        }

        if (stackType === "image" && !isLeafElement) {
            // further filtered down in prepareAnimation()
            return;
        }

        // tentative x and y offsets
        const parentBox = node.parentElement.getBoundingClientRect();
        const leftOffset = nodeBox.left - parentBox.left;
        const topOffset = 0; // nodeBox.top - parentBox.top;

        // layer candidates are further pruned in prepareAnimation() based on blocked elems & parent offsets

        if (stackType === "image" || leftOffset !== 0 || topOffset !== 0) {
            // console.log(leftOffset, node);
            this.animationLayerCandidates.push([
                node,
                {
                    stackType,
                    nodeBox,
                },
            ]);
        }
    }

    // text containers put on seperate CSS GPU layers, with their original position transforms
    private animationLayerTransforms: [
        HTMLElement,
        {
            translateX: number;
            translateY: number;
            scaleX?: number;
        }
    ][] = [];
    prepareAnimation() {
        // filter to visible elements, and read after-content-block DOM position
        const layerElements: Map<
            HTMLElement,
            {
                stackType: string;
                nodeBox: DOMRect;
                afterNodeBox: DOMRect;
                afterMarginLeft: number;
                afterMarginTop: number;
                parentLayer: HTMLElement;
            }
        > = new Map();
        this.animationLayerCandidates.forEach(
            ([node, { stackType, nodeBox }]) => {
                const afterNodeBox = node.getBoundingClientRect();
                if (afterNodeBox.height === 0) {
                    // ignore blocked elements
                    return;
                }

                const afterStyle = window.getComputedStyle(node);
                const afterMarginLeft = pxToNumber(afterStyle.marginLeft);
                const afterMarginTop = pxToNumber(afterStyle.marginTop);

                layerElements.set(node, {
                    stackType,
                    nodeBox,
                    afterNodeBox,
                    afterMarginLeft,
                    afterMarginTop,
                    parentLayer: null, // set below
                });
            }
        );

        // populate parent layer for each layer
        layerElements.forEach((properties, node) => {
            let parentLayer = node.parentElement;
            while (parentLayer && !layerElements.has(parentLayer)) {
                parentLayer = parentLayer.parentElement;
            }

            layerElements.set(node, {
                ...properties,
                parentLayer,
            });
        });

        // remove unnecessary layers from map
        layerElements.forEach((properties, node) => {
            if (
                node === document.body ||
                properties.parentLayer === document.body
            ) {
                // allow all top-level layers
                return;
            }

            const parentLayerProps = layerElements.get(properties.parentLayer);
            if (!parentLayerProps) {
                // console.log("no valid parent", node, properties.parentLayer);
                return;
            }

            // only keep one layer per image chain (often matches containers by classname)
            if (
                properties.stackType === "image" &&
                parentLayerProps.stackType === "image"
            ) {
                layerElements.delete(node);
                return;
            }

            // container styles collapsed layers (parent has no other content)
            // e.g. on https://www.nbcnews.com/business/business-news/tesla-racism-lawsuit-worker-rejects-15-million-payout-rcna34655
            if (
                properties.afterNodeBox.top ===
                    parentLayerProps?.afterNodeBox.top &&
                properties.afterNodeBox.height ===
                    parentLayerProps?.afterNodeBox.height
            ) {
                // console.log("delete", properties.parentLayer);

                layerElements.set(node, {
                    ...properties,
                    parentLayer: parentLayerProps.parentLayer,
                });
                layerElements.delete(properties.parentLayer);
                return;
            }
        });

        // generate animation layer properties
        this.animationLayerTransforms = [...layerElements.entries()]
            .filter(([node]) => node !== document.body)
            .map(([node, layerProps]) => {
                const parentLayerProps = layerElements.get(
                    layerProps.parentLayer
                );
                if (!parentLayerProps) {
                    // console.log("no valid parent", node);
                    return;
                }
                // console.log(
                //     "layer",
                //     layerProps.stackType,
                //     node,
                //     layerProps.parentLayer
                // );

                // get x and y transforms
                // allow negative e.g. on https://www.statnews.com/2019/06/25/alzheimers-cabal-thwarted-progress-toward-cure/
                const beforeLeftOffset =
                    layerProps.nodeBox.left - parentLayerProps.nodeBox.left;
                const afterLeftOffset =
                    layerProps.afterNodeBox.left -
                    parentLayerProps.afterNodeBox.left;
                const translateX =
                    beforeLeftOffset -
                    afterLeftOffset -
                    parentLayerProps.afterMarginLeft; // only after margins are relevant, since transform() is relative to it

                const beforeTopOffset =
                    layerProps.nodeBox.top - parentLayerProps.nodeBox.top;
                const afterTopOffset =
                    layerProps.afterNodeBox.top -
                    parentLayerProps.afterNodeBox.top;
                const translateY =
                    beforeTopOffset -
                    afterTopOffset -
                    parentLayerProps.afterMarginTop;

                let scaleX = null;
                // animate header image width (not for text elements for performance)
                if (layerProps.stackType === "image") {
                    scaleX =
                        layerProps.nodeBox.width /
                        layerProps.afterNodeBox.width;
                }

                return [
                    node,
                    {
                        translateX,
                        translateY,
                        scaleX,
                    },
                ];
            })
            .filter((x) => x);

        this.positionAnimationLayers();
    }

    // put text containers in same place as before content block, but positioned using CSS transforms
    private positionAnimationLayers() {
        this.animationLayerTransforms.map(
            ([node, { translateX, translateY, scaleX }]) => {
                let transform = `translate(${translateX}px, ${translateY}px)`;
                if (scaleX) {
                    transform += ` scale(${scaleX})`;
                    node.style.setProperty("transform-origin", "top left");
                }
                node.style.setProperty("transform", transform);

                node.style.setProperty("left", "0"); // e.g. xkcd.com
                node.style.setProperty("display", "block"); // can only animate blocks?

                // put on new layer
                node.style.setProperty("will-change", "transform");
            }
        );
    }

    executeAnimation() {
        this.animationLayerTransforms.map(([node, { scaleX }]) => {
            node.style.setProperty(
                "transition",
                "transform 0.4s cubic-bezier(0.33, 1, 0.68, 1)"
            );

            let transform = `translate(0, 0)`;
            if (scaleX) {
                transform += ` scale(1)`;
            }
            node.style.setProperty("transform", transform);
        });
    }

    executeReverseAnimation() {
        this.positionAnimationLayers();
    }

    // very carefully exclude elements as text containers to avoid incorrect main container selection for small articles
    // this doesn't mean these elements will be removed, but they might
    private shouldExcludeAsTextContainer(node: HTMLElement) {
        if (["BLOCKQUOTE", "CODE", "PRE"].includes(node.tagName)) {
            // leave style of quotes intact
            // e.g. https://knowledge.wharton.upenn.edu/article/how-price-shocks-in-formative-years-scar-consumption-for-life/
            return true;
        }

        if (
            [
                "module-moreStories", // https://news.yahoo.com/thailand-legalizes-growing-consumption-marijuana-135808124.html
                "comments", // https://leslefts.blogspot.com/2013/11/the-great-medieval-water-myth.html
            ].includes(node.id) ||
            node.getAttribute("aria-hidden") === "true"
        ) {
            return true;
        }

        return false;
    }

    // Make sure the classes we added do not get removed by the site JS (e.g. on techcrunch.com)
    private classNamesObserver: MutationObserver;
    private watchElementClassnames() {
        if (document.body.classList.contains("notion-body")) {
            // notion undos all className changes, see e.g. https://abhinavsharma.com/blog/google-alternatives
            this.foundMainContentElement = false;
            this.foundMainHeadingElement = false;
            return;
        }

        this.classNamesObserver = new MutationObserver((mutations) =>
            mutations.forEach((mutation) => {
                const target = mutation.target as HTMLElement;

                if (this.nodeClasses.has(target)) {
                    const removedClasses = this.nodeClasses
                        .get(target)
                        .filter(
                            (className) => !target.classList.contains(className)
                        );

                    if (removedClasses.length > 0) {
                        target.classList.add(...removedClasses);
                    }
                }
            })
        );
        this.classNamesObserver.observe(document.body, {
            subtree: true,
            attributeFilter: ["class"],
        });
    }
}
