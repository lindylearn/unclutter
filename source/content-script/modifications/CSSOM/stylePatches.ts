import { PageModifier, trackModifierExecution } from "../_interface";
import CSSOMProvider, { isStyleRule } from "./_provider";

@trackModifierExecution
export default class StylePatchesModifier implements PageModifier {
    private cssomProvider: CSSOMProvider;

    constructor(cssomProvider: CSSOMProvider) {
        this.cssomProvider = cssomProvider;
    }

    async afterTransitionIn() {
        this.cssomProvider.iterateRules((rule) => {
            if (isStyleRule(rule)) {
                this.styleRuleTweaks(rule);
            }
        });
    }

    private styleRuleTweaks(rule: CSSStyleRule) {
        // performance is important here, as this run on every single CSS declation
        // can take up to 600ms e.g. for https://slack.com/intl/en-gb/blog/collaboration/etiquette-tips-in-slack
        if (
            !rule.style.width &&
            !rule.style &&
            !rule.style.height &&
            !rule.style.maxHeight
        ) {
            return;
        }

        // hack: remove vw and vh rules for now (mostly used to add margin, which we already add elsewhere)
        // conditionScale is not neccessarily equal to actual pageview with, so cannot easily get correct margin
        if (
            rule.style.getPropertyValue("width")?.includes("vw") ||
            rule.style.getPropertyValue("min-width")?.includes("vw")
        ) {
            rule.style.setProperty("width", "100%");
            rule.style.setProperty("min-width", "100%");
        }
        if (
            rule.style.getPropertyValue("height")?.includes("vh") ||
            rule.style.getPropertyValue("min-height")?.includes("vh")
        ) {
            rule.style.setProperty("height", "100%");
            rule.style.setProperty("min-height", "100%");
        }
    }
}
