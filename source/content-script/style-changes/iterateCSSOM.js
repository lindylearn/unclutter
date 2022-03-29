import browser from "../../common/polyfill";
import { createStylesheetText } from "./common";

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

                let cssText = await fetchCssRemote(sheet.href);

                const baseUrl = sheet.href || window.location.href;
                cssText = transformProxyCssText(cssText, baseUrl);

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
                styleRuleTweaks(rule);
            } else if (rule.type === CSSRule.SUPPORTS_RULE) {
                // recurse
                mapAggregatedRule(rule);
            } else if (rule.type === CSSRule.MEDIA_RULE) {
                // recurse
                mapAggregatedRule(rule);

                const [appliedBefore, appliesNow] = parseMediaCondition(
                    rule,
                    oldWidth,
                    newWidth
                );
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

    return [
        hideNoise.bind(null, fixedPositionRules, expiredRules, newRules),
        enableResponsiveStyle.bind(null, expiredRules, newRules),
    ];
}

function parseMediaCondition(rule, oldWidth, newWidth) {
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

function styleRuleTweaks(rule) {
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

const animatedRulesToHide = [];
function hideNoise(fixedPositionRules, expiredRules, newRules) {
    fixedPositionRules.map((rule) => {
        rule.style.setProperty("display", "block", "important");
        rule.style.setProperty("opacity", "0", "important");
        rule.style.setProperty("visibility", "hidden", "important");
        rule.style.setProperty(
            "transition",
            "visibility 0.3s, opacity 0.3s linear"
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
                "visibility 0.3s, opacity 0.3s linear"
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
function transformProxyCssText(cssText, baseUrl) {
    // Transform css text before old style is replaced to prevent flicker

    // New inline style will have different base ref than imported stylesheets, so replace relative file references
    // e.g. https://arstechnica.com/science/2022/03/plant-based-nanocrystals-could-be-the-secret-to-preventing-crunchy-ice-cream/
    cssText = cssText.replace(
        /url\((('.+?')|(".+?")|([^\)]*?))\)/g,
        (match) => {
            try {
                const relativeUrl = match
                    .replace(/^url\((.*)\)$/, "$1")
                    .trim()
                    .replace(/^"(.*)"$/, "$1")
                    .replace(/^'(.*)'$/, "$1");
                const absoluteUrl = new URL(relativeUrl, baseUrl);

                return `url("${absoluteUrl}")`;
            } catch (err) {
                console.error(
                    "Not able to replace relative URL with Absolute URL, skipping",
                    err
                );
                return match;
            }
        }
    );

    // TODO parse imported sheets as well? or get notified through listener?
    // TODO find example site for import rules
    // cssText = cssText.replace(
    //     /@import\s*(url\()?(('.+?')|(".+?")|([^\)]*?))\)? ?(screen)?;?/gi,
    //     (match) => {
    //         try {
    //             console.log(match);

    //             return match;
    //         } catch (err) {
    //             console.error(
    //                 "Not able to replace relative URL with Absolute URL, skipping",
    //                 err
    //             );
    //             return match;
    //         }
    //     }
    // );

    return cssText;
}

export function disable() {}
