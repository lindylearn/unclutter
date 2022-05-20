import { PageModifier, trackModifierExecution } from "../_interface";
import CSSOMProvider, {
    isMediaRule,
    isStyleRule,
    isSupportsRule,
} from "./_provider";

@trackModifierExecution
export default class ResponsiveStyleModifier implements PageModifier {
    private oldWidth = window.innerWidth;
    private newWidth = 750;

    private fixedPositionRules: CSSStyleRule[] = [];
    private expiredRules: CSSStyleRule[] = [];
    private newRules: CSSStyleRule[] = [];

    async prepare(cssomProvider: CSSOMProvider) {
        cssomProvider.stylesheets.map((sheet) => {
            this.mapAggregatedRule(sheet);
        });
    }

    private mapAggregatedRule(aggregationNode: CSSGroupingRule) {
        for (let rule of aggregationNode.cssRules) {
            if (isStyleRule(rule)) {
                const position = rule.style.position;
                if (
                    position &&
                    (position === "fixed" || position === "sticky")
                ) {
                    this.fixedPositionRules.push(rule);
                }
            } else if (isSupportsRule(rule)) {
                // recurse
                this.mapAggregatedRule(rule);
            } else if (isMediaRule(rule)) {
                // recurse
                this.mapAggregatedRule(rule);

                const [appliedBefore, appliesNow] = parseMediaCondition(
                    rule,
                    this.oldWidth,
                    this.newWidth
                );
                if (appliedBefore && !appliesNow) {
                    this.expiredRules.push(
                        ...[...rule.cssRules].filter((rule) => !!rule.style)
                    );
                }
                if (!appliedBefore && appliesNow) {
                    this.newRules.push(
                        ...[...rule.cssRules].filter((rule) => !!rule.style)
                    );
                }
            }
        }
    }

    private animatedRulesToHide = []; // list of obj and previous display style

    fadeOutNoise() {
        // fade-out fixed elements
        this.fixedPositionRules.map((rule) => {
            // Check which elements were actually visible
            // This does not catch all visible elements, e.g. if another rule overrides opacity
            // Alternative is window.getComputedStyle(), which is more expensive to call
            if (
                rule.style.getPropertyValue("display") !== "none" &&
                rule.style.getPropertyValue("opacity") !== "0"
            ) {
                // Element is visible right now, so re-enable when disabling pageview
                // might be hidden by another rule, which is fine

                // Save current display to keep e.g. flex at https://www.esa.int/Enabling_Support/Space_Transportation/Ariane_6_Vega-C_microlaunchers_ESA_looks_to_full_range_of_launch_options_for_European_institutional_missions
                this.animatedRulesToHide.push([
                    rule,
                    rule.style.getPropertyValue("display"),
                ]);
            }

            // Hide every static element as it could still popup up later
            rule.style.removeProperty("display");
            rule.style.setProperty("opacity", "0", "important");
            rule.style.setProperty("visibility", "hidden", "important");
            rule.style.setProperty("transition", "all 0.3s linear");
        });

        // TODO fade-out expiredRules?

        // fade-out elements hidden at mobile viewport
        this.newRules.map((rule) => {
            if (rule.style.getPropertyValue("display") === "none") {
                // Modify old style to get updated cssText
                rule.style.removeProperty("display");
                rule.style.setProperty("opacity", "0", "important");
                rule.style.setProperty("visibility", "hidden", "important");
                rule.style.setProperty("transition", "all 0.3s linear");
                rule.style.setProperty("background-color", "green");
                rule.style.setProperty("max-height", "500px");

                // Insert new rule for the fade-out
                const newIndex = rule.parentStyleSheet.insertRule(
                    rule.cssText,
                    rule.parentStyleSheet.cssRules.length
                );
                const newRule = rule.parentStyleSheet.cssRules[
                    newIndex
                ] as CSSStyleRule;

                // Revert style change on original rule
                rule.style.setProperty("display", "none");

                // Handle fade-in
                this.animatedRulesToHide.push([newRule, "block"]);
            }
        });
    }

    private originalStyleList: object[] = [];
    private addedRules: CSSStyleRule[] = [];
    transitionIn() {
        // completely remove fade-out elements (shifts layout)
        this.fixedPositionRules.map((rule) => {
            rule.style.setProperty("display", "none", "important");
        });
        this.animatedRulesToHide.map(([rule, display]) => {
            // rule.style.setProperty("display", "none", "important");
            rule.style.setProperty("min-height", "0", "important");
            rule.style.setProperty("max-height", "0", "important");
            rule.style.setProperty("overflow", "hidden", "important");
        });
    }

    enableResponsiveStyles() {
        // disable desktop-only styles
        this.expiredRules.map((rule, index) => {
            // actually deleting & reinserting rule is hard -- need to keep track of mutating rule index
            // so simply remove style properties from rule

            // save properties for restoration later
            // TODO measure performance of this
            const obj = {};
            for (const key of rule.style) {
                obj[key] = rule.style.getPropertyValue(key);
            }
            this.originalStyleList.push(obj);

            // this works, even if it should be read-only in theory
            rule.style = { transition: "all 0.2s linear" };
        });

        // enable mobile styles
        this.newRules.map((rule) => {
            const newIndex = rule.parentStyleSheet.insertRule(
                rule.cssText,
                rule.parentStyleSheet.cssRules.length
            );
            const newRule = rule.parentStyleSheet.cssRules[
                newIndex
            ] as CSSStyleRule;

            newRule.style.setProperty("transition", "all 0.2s linear");

            this.addedRules.push(newRule);
        });
    }

    async transitionOut() {
        this.expiredRules.map((rule, index) => {
            for (const [key, value] of Object.entries(
                this.originalStyleList[index]
            )) {
                rule.style.setProperty(key, value);
            }
        });

        this.addedRules.map((rule) => {
            rule.style = {};
        });

        // set up for animation again
        this.animatedRulesToHide.map(([rule, display]) => {
            rule.style.setProperty("opacity", "0", "important");
            rule.style.setProperty("visibility", "hidden", "important");

            // Position: sticky doesn't show correctly unfortunately
            // e.g. at https://slack.com/intl/en-gb/blog/collaboration/etiquette-tips-in-slack

            rule.style.setProperty("display", display);
        });
    }

    async fadeInNoise() {
        this.animatedRulesToHide.map(([rule, display]) => {
            rule.style.removeProperty("opacity", "1");
            rule.style.removeProperty("visibility", "visible");
            rule.style.setProperty(
                "transition",
                "visibility 0.3s, opacity 0.3s linear"
            );
        });
    }
}

function parseMediaCondition(
    rule: CSSMediaRule,
    oldWidth: number,
    newWidth: number
) {
    // TODO ideally, iterate the media list
    const condition = rule.media[0];

    // get viewport range where condition applies
    let min = 0;
    let max = Infinity;
    let minMatch = /\(min-width:\s*([0-9]+)([a-z]+)/g.exec(condition);
    let maxMatch = /\(max-width:\s*([0-9]+)([a-z]+)/g.exec(condition);
    if (minMatch) {
        min = unitToPx(minMatch[2], parseFloat(minMatch[1]));
    }
    if (maxMatch) {
        max = unitToPx(maxMatch[2], parseFloat(maxMatch[1]));
    }

    const appliedBefore = min <= oldWidth && oldWidth <= max;
    const appliesNow = min <= newWidth && newWidth <= max;

    return [appliedBefore, appliesNow];
}

function unitToPx(unit, value) {
    if (unit === "px") {
        return value;
    } else if (unit === "em" || unit === "rem") {
        const rootFontSize = window
            .getComputedStyle(document.documentElement)
            .getPropertyValue("font-size");
        const rootFontSizePx = parseFloat(rootFontSize.match(/\d+/)[0]);

        return value * rootFontSizePx;
    } else {
        console.error(`Unexpected media query breakpoint unit ${unit}:`, value);
        return 1000000;
    }
}
