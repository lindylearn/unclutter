import { pxToNumber } from "../../common/css";
import { overrideClassname } from "../../common/stylesheets";
import ThemeModifier from "./CSSOM/theme";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class BackgroundModifier implements PageModifier {
    private themeModifier: ThemeModifier;

    private backgroundElement: HTMLElement;
    private resizeObserver: ResizeObserver;

    constructor(themeModifier: ThemeModifier) {
        this.themeModifier = themeModifier;
    }

    private initialBodyHeight: number;
    prepare() {
        // read height before modifying DOM
        this.initialBodyHeight = document.body.scrollHeight;
    }

    // Insert an element behind a site's <body> content to show a white background if the page doesn't provide it.
    // The height of this element needs to be dynamically kept in sync with the body height.
    insertBackground() {
        // create element of full height of all children, in case body height != content height
        this.backgroundElement = document.createElement("div");
        this.backgroundElement.id = "lindy-body-background";
        this.backgroundElement.className = `${overrideClassname} lindy-body-background`;

        // body '100%' may not refer to full height of children (e.g. https://torontolife.com/memoir/the-horrifying-truth-about-my-biological-father/)
        // so also se min-height based on children scollHeight
        this.backgroundElement.style.setProperty("height", "100%", "important");
        this.backgroundElement.style.setProperty(
            "min-height",
            `${this.initialBodyHeight}px`,
            "important"
        );

        this.scaleUpWidthToPage();

        document.body.appendChild(this.backgroundElement);
    }

    removeBackground() {
        this.backgroundElement.remove();
    }

    // scale-up background to entire screen width using transform (performant to animate)
    private scaleUpWidthToPage() {
        const initialScale =
            window.innerWidth / pxToNumber(this.themeModifier.theme.pageWidth);
        this.backgroundElement.style.setProperty(
            "transform",
            `scaleX(${initialScale}) translateY(-10px)`,
            "important"
        );
    }

    animateWidthReduction() {
        this.backgroundElement.style.setProperty(
            "transform",
            "scaleX(1.0) translateY(0)",
            "important"
        );
    }

    animateReverseWidthReduction() {
        this.scaleUpWidthToPage();
    }

    observeHeightChanges() {
        // observe children height changes
        this.resizeObserver = new ResizeObserver(() => {
            this.updateBackgroundHeight();
        });
        [...document.body.children].map((node) =>
            this.resizeObserver.observe(node)
        );
    }

    unObserveHeightChanges() {
        this.resizeObserver.disconnect();
    }

    private updateBackgroundHeight() {
        // get height of body children to exclude background element itself
        // TODO exclude absolute positioned elements?
        const childHeights = [...document.body.children]
            .filter((node) => node.id !== "lindy-body-background")
            .map((node) => node.scrollHeight);

        const bodyHeigth = childHeights.reduce(
            (sum, height) => sum + height,
            0
        );

        this.backgroundElement?.style.setProperty(
            "min-height",
            `${bodyHeigth}px`,
            "important"
        );
    }
}
