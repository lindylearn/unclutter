import { PageModifier, trackModifierExecution } from "../_interface";
import CSSOMProvider, { isStyleRule } from "./_provider";

@trackModifierExecution
export default class StylePatchesModifier implements PageModifier {
    private cssomProvider: CSSOMProvider;

    constructor(cssomProvider: CSSOMProvider) {
        this.cssomProvider = cssomProvider;
    }

    private styleRuleTweaks: [CSSStyleRule, { [key: string]: string }][] = [];
    private originalStyleValues: [CSSStyleRule, { [key: string]: [string, boolean] }][] = [];
    async prepare() {
        // iterating the CSSOM can take time -- so run outside transitionIn()
        // TODO maybe do in afterTransitionIn()?
        this.cssomProvider.iterateRules((rule) => {
            if (isStyleRule(rule)) {
                this.prepareStyleRuleTweaks(rule);
            }
        });
    }

    transitionIn() {
        this.styleRuleTweaks.forEach(([rule, propertiesToSet]) => {
            for (const [key, value] of Object.entries(propertiesToSet)) {
                rule.style.setProperty(key, value);
            }
        });
    }

    transitionOut() {
        this.originalStyleValues.forEach(([rule, propertiesToSet]) => {
            for (const [key, [value, isImportant]] of Object.entries(propertiesToSet)) {
                rule.style.setProperty(key, value, isImportant ? "important" : "");
            }
        });
    }

    private prepareStyleRuleTweaks(rule: CSSStyleRule) {
        // performance is important here, as this run on every single CSS declation
        // can take up to 600ms e.g. for https://slack.com/intl/en-gb/blog/collaboration/etiquette-tips-in-slack
        if (
            !rule.style.width &&
            !rule.style &&
            !rule.style.height &&
            !rule.style.maxHeight &&
            !rule.style.margin &&
            !rule.style.left
        ) {
            return;
        }

        let override = false;
        const propertiesToSet = {};

        // hack: remove vw and vh rules for now (mostly used to add margin, which we already add elsewhere)
        // conditionScale is not neccessarily equal to actual pageview with, so cannot easily get correct margin
        if (
            rule.style.getPropertyValue("width")?.includes("vw") ||
            rule.style.getPropertyValue("min-width")?.includes("vw")
        ) {
            override = true;
            propertiesToSet["width"] = "100%";
            propertiesToSet["min-width"] = "100%";
        }
        if (
            rule.style.getPropertyValue("height")?.includes("vh") ||
            rule.style.getPropertyValue("min-height")?.includes("vh")
        ) {
            override = true;
            propertiesToSet["height"] = "100%";
            propertiesToSet["min-height"] = "100%";
        }

        if (rule.style.getPropertyValue("margin")?.includes("vw")) {
            override = true;
            propertiesToSet["margin"] = "0";
        }
        if (rule.style.getPropertyValue("left")?.includes("vw")) {
            override = true;
            propertiesToSet["left"] = "0";
        }

        if (override) {
            this.styleRuleTweaks.push([rule, propertiesToSet]);

            const originalValues = {};
            for (const [key] of Object.entries(propertiesToSet)) {
                originalValues[key] = [
                    rule.style.getPropertyValue(key),
                    rule.style.getPropertyPriority(key) === "important",
                ];
            }
            this.originalStyleValues.push([rule, originalValues]);
        }
    }
}
