import { PageModifier, trackModifierExecution } from "../_interface";
import CSSOMProvider, {
    isMediaRule,
    isStyleRule,
    isSupportsRule,
} from "./_provider";

@trackModifierExecution
export default class ResponsiveStyleModifier implements PageModifier {
    private cssomProvider: CSSOMProvider;

    private oldWidth = window.innerWidth;
    private newWidth = 750;
    private rootFontSizePx: number;

    private fixedPositionRules: CSSStyleRule[] = [];
    private expiredRules: CSSStyleRule[] = [];
    private newRules: CSSStyleRule[] = [];

    constructor(cssomProvider: CSSOMProvider) {
        this.cssomProvider = cssomProvider;

        // font size used to convert 'em' breakpoints to px
        const rootFontSize = window
            .getComputedStyle(document.documentElement)
            .getPropertyValue("font-size");
        this.rootFontSizePx = parseFloat(rootFontSize.match(/\d+/)[0]);
    }

    async iterateCSSOM() {
        this.cssomProvider.stylesheets.map((sheet) => {
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

                const [appliedBefore, appliesNow] = this.parseMediaCondition(
                    rule,
                    this.oldWidth,
                    this.newWidth
                );
                if (appliedBefore && !appliesNow) {
                    this.expiredRules.push(
                        ...[...rule.cssRules].filter(
                            (rule) => isStyleRule(rule) && !!rule.style
                        )
                    );
                }
                if (!appliedBefore && appliesNow) {
                    this.newRules.push(
                        ...[...rule.cssRules].filter(
                            (rule) => isStyleRule(rule) && !!rule.style
                        )
                    );
                }
            }
        }
    }

    private expiredRulesOriginalStyles: object[] = [];
    private addedRules: CSSStyleRule[] = [];
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
            this.expiredRulesOriginalStyles.push(obj);

            // @ts-ignore this works, even if it should be read-only in theory
            rule.style = {};
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

            this.addedRules.push(newRule);
        });
    }

    disableResponsiveStyles() {
        this.expiredRules.map((rule, index) => {
            for (const [key, value] of Object.entries(
                this.expiredRulesOriginalStyles[index]
            )) {
                rule.style.setProperty(key, value);
            }
        });

        this.addedRules.map((rule) => {
            // @ts-ignore this works, even if it should be read-only in theory
            rule.style = {};
        });
    }

    private fixedElementsOriginalDisplay: string[] = [];
    blockFixedElements() {
        // completely remove fade-out elements (shifts layout)
        this.fixedElementsOriginalDisplay = this.fixedPositionRules.map(
            (rule) => {
                const originalValue = rule.style.getPropertyValue("display");

                rule.style.setProperty("display", "none", "important");

                return originalValue;
            }
        );
    }

    unblockFixedElements() {
        this.fixedPositionRules.map((rule, index) => {
            const originalValue = this.fixedElementsOriginalDisplay[index];
            rule.style.setProperty("display", originalValue);
        });
    }

    private parseMediaCondition(
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
            min = this.unitToPx(minMatch[2], parseFloat(minMatch[1]));
        }
        if (maxMatch) {
            max = this.unitToPx(maxMatch[2], parseFloat(maxMatch[1]));
        }

        const appliedBefore = min <= oldWidth && oldWidth <= max;
        const appliesNow = min <= newWidth && newWidth <= max;

        return [appliedBefore, appliesNow];
    }

    private unitToPx(unit: string, value: number) {
        if (unit === "px") {
            return value;
        } else if (unit === "em" || unit === "rem") {
            return value * this.rootFontSizePx;
        } else {
            console.error(
                `Unexpected media query breakpoint unit ${unit}:`,
                value
            );
            return 1000000;
        }
    }
}
