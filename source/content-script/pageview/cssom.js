import browser from "../../common/polyfill";
import { createStylesheetText } from "../style-changes/common";

export async function iterateCSSOM() {
    const stylesheets = [...document.styleSheets];
    const accessibleStylesheets = await Promise.all(
        stylesheets.map(async (sheet) => {
            try {
                sheet.cssRules;
                return sheet;
            } catch (err) {
                console.log(`Replicating ${sheet.href}...`);

                const styleId = sheet.href.split("/").pop().split(".")[0];

                const cssText = await fetchCssRemote(sheet.href);
                if (cssText) {
                    const element = createStylesheetText(cssText, styleId);

                    sheet.disabled = true;

                    return element.sheet;
                }
            }
        })
    );
    // TODO listen to new

    const oldWidth = window.innerWidth;
    const newWidth = 750;

    const fixedPositionRules = [];
    const expiredRules = [];
    const newRules = [];
    function mapAggregatedRule(aggregationNode) {
        for (const rule of aggregationNode.cssRules) {
            if (rule.type === CSSRule.STYLE_RULE) {
                if (
                    rule.style.getPropertyValue("position") === "fixed" ||
                    rule.style.getPropertyValue("position") === "sticky"
                ) {
                    fixedPositionRules.push(rule);
                }
            } else if (rule.type === CSSRule.SUPPORTS_RULE) {
                // recurse
                mapAggregatedRule(rule);
            } else if (rule.type === CSSRule.MEDIA_RULE) {
                // recurse
                mapAggregatedRule(rule);

                // TODO ideally, iterate the media list
                const condition = rule.media[0];

                // get viewport range where condition applies
                let min = 0;
                let max = Infinity;
                let minMatch = /\(min-width:\s*([0-9]+)px/g.exec(
                    condition
                )?.[1];
                let maxMatch = /\(max-width:\s*([0-9]+)px/g.exec(
                    condition
                )?.[1];
                if (minMatch) {
                    min = parseInt(minMatch);
                }
                if (maxMatch) {
                    max = parseInt(maxMatch);
                }

                const appliedBefore = min <= oldWidth && oldWidth <= max;
                const appliesNow = min <= newWidth && newWidth <= max;

                if (appliedBefore && !appliesNow) {
                    expiredRules.push(
                        ...[...rule.cssRules].filter((rule) => !!rule.style)
                    );
                }
                if (!appliedBefore && appliesNow) {
                    newRules.push(
                        ...[...rule.cssRules].filter((rule) => !!rule.style)
                    );
                }
            }
        }
    }

    accessibleStylesheets
        .filter((sheet) => sheet)
        .map((sheet) => {
            mapAggregatedRule(sheet);
        });

    // console.log("expiredRules", expiredRules);
    // console.log("newRules", newRules);

    return [
        hideNoise.bind(null, fixedPositionRules, expiredRules, newRules),
        enableResponsiveStyle.bind(null, expiredRules, newRules),
    ];
}

const animatedRulesToHide = [];
function hideNoise(fixedPositionRules, expiredRules, newRules) {
    fixedPositionRules.map((rule) => {
        rule.style.setProperty("display", "block", "important");
        rule.style.setProperty("opacity", "0", "important");
        rule.style.setProperty("visibility", "hidden", "important");
        rule.style.setProperty(
            "transition",
            "visibility 0.5s, opacity 0.5s linear"
        );

        animatedRulesToHide.push(rule);
    });

    // expiredRules.map((rule) => {
    //     // CSSStyleDeclaration has getters for every CSS property
    //     // Alternative to for...of is iterate via index and item()
    //     for (const key of rule.style) {
    //         const value = rule.style.getPropertyValue(key);
    //         console.log("removed", key, value);

    //         if (key === "display" && value !== "none") {
    //             rule.style.setProperty("background-color", "red", "important");
    //         }
    //     }
    // });

    newRules.map((rule) => {
        if (rule.style.getPropertyValue("display") === "none") {
            rule.style.setProperty("opacity", "0", "important");
            rule.style.setProperty("visibility", "hidden", "important");
            rule.style.setProperty(
                "transition",
                "visibility 0.5s, opacity 0.5s linear"
            );

            animatedRulesToHide.push(rule);
        }
    });
}

function enableResponsiveStyle(expiredRules, newRules) {
    expiredRules.map((rule) => {
        // actually deleting & reinserting rule is much harder -- need to keep track of (mutating) rule index
        // so simply remove style properties from rule
        rule.style = {};
    });

    newRules.map((rule) => {
        const newIndex = rule.parentStyleSheet.insertRule(
            rule.cssText,
            rule.parentStyleSheet.cssRules.length
        );
        const newRule = rule.parentStyleSheet.cssRules[newIndex];
    });

    animatedRulesToHide.map((rule) => {
        // TODO handle importance
        rule.style.setProperty("display", "none");
    });
}

export function disable() {}

// Send an event to the extensions service worker to rewrite a stylesheet, and wait for a response.
async function fetchCssRemote(url) {
    const response = await browser.runtime.sendMessage(null, {
        event: "fetchCss",
        url,
    });
    if (response.status === "success") {
        return response.cssText;
    }
    if (response.status === "error") {
        console.error(`Error fetching CSS:`, err);
        return null;
    }
    console.error(`Error fetching CSS`);
    return null;
}
