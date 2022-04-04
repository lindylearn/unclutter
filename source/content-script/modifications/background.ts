import { overrideClassname } from "../../common/stylesheets";
import {
    backgroundColorThemeVariable,
    originalBackgroundThemeVariable,
    setCssThemeVariable,
} from "../../common/theme";
import { PageModifier, trackModifierExecution } from "./_interface";

@trackModifierExecution
export default class BackgroundModifier implements PageModifier {
    constructor() {}

    async fadeOutNoise() {
        this.insertBackground();
    }

    // Insert an element behind a site's <body> content to show a white background if the page doesn't provide it.
    // The height of this element needs to be dynamically kept in sync with the body height.
    private insertBackground() {
        // create element of full height of all children, in case body height != content height
        var background = document.createElement("div");
        background.id = "lindy-body-background";
        background.className = `${overrideClassname} lindy-body-background`;

        // Save original <body> background in theme variable (not modified yet)
        let bodyBackground = window.getComputedStyle(
            document.body
        ).backgroundColor;

        if (bodyBackground.includes("rgba(0, 0, 0, 0)")) {
            bodyBackground = "white"; // transparent
        }
        setCssThemeVariable(backgroundColorThemeVariable, bodyBackground);
        setCssThemeVariable(originalBackgroundThemeVariable, bodyBackground);

        // Set background color on both <body> and the background element to be more resistant
        document.body.style.setProperty(
            "background",
            `var(${backgroundColorThemeVariable})`,
            "important"
        );

        // body '100%' may not refer to full height of children (e.g. https://torontolife.com/memoir/the-horrifying-truth-about-my-biological-father/)
        // so also se min-height based on children scollHeight
        background.style.setProperty("height", "100%", "important");
        background.style.setProperty(
            "min-height",
            `${document.body.scrollHeight}px`,
            "important"
        );

        // observe children height changes
        const observer = new ResizeObserver(() => {
            this.updateBackgroundHeight();
        });
        [...document.body.children].map((node) => observer.observe(node));

        document.body.appendChild(background);
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

        const background = document.getElementById("lindy-body-background");
        if (background) {
            background.style.setProperty(
                "min-height",
                `${bodyHeigth}px`,
                "important"
            );
        }
    }
}
