import { createStylesheetText } from "source/common/stylesheets";
import browser from "../../../common/polyfill";

export default class CSSOMProvider {
    public stylesheets: CSSStyleSheet[];

    async prepare() {
        const allStylesheets = [...document.styleSheets];

        const accessibleStylesheets = await Promise.all(
            allStylesheets.map(async (sheet) => {
                // Only consider applicable stylesheets
                // e.g. 'print' at https://www.theguardian.com/world/2022/mar/25/russian-troops-mutiny-commander-ukraine-report-western-officials
                // TODO also consider responsive styles that would become valid?

                if (
                    sheet.disabled ||
                    sheet.ownerNode?.classList.contains(
                        "lindylearn-document-override"
                    ) ||
                    sheet.ownerNode?.classList.contains("darkreader") ||
                    !window.matchMedia(sheet.media.mediaText).matches
                ) {
                    // console.log(
                    //     `Excluding stylesheet with class ${sheet.ownerNode?.classList} and media condition '${sheet.media.mediaText}'`
                    // );
                    return;
                }

                // Exclude font stylesheets
                if (sheet.href) {
                    const url = new URL(sheet.href);
                    if (
                        [
                            "fonts.googleapis.com",
                            "pro.fontawesome.com",
                        ].includes(url.hostname)
                    ) {
                        return;
                    }
                    if (
                        url.pathname.includes("font") ||
                        url.pathname.endsWith(".woff2")
                    ) {
                        return;
                    }
                }

                try {
                    sheet.cssRules;
                    return sheet;
                } catch (err) {
                    if (!sheet.href) {
                        // e.g. cannot access CSSOM style rules created by Dark Reader on Firefox
                        console.log(`Inaccessible stylesheet:`, sheet, err);
                        return;
                    }

                    // console.log(`Replicating ${sheet.href}...`);

                    const styleId = sheet.href?.split("/").pop().split(".")[0];

                    let cssText = await fetchCssRemote(sheet.href);

                    const baseUrl = sheet.href || window.location.href;
                    cssText = transformProxyCssText(cssText, baseUrl);

                    if (cssText) {
                        const element = createStylesheetText(
                            cssText,
                            "lindy-stylesheet-proxy"
                        );

                        if (sheet.ownerNode) {
                            // In theory this should never be null, but it can happen
                            // e.g. on https://theconversation.com/how-fast-can-we-stop-earth-from-warming-178295
                            disableStylesheet(sheet.ownerNode, styleId);
                        }

                        return element.sheet;
                    }
                }
            })
        );

        this.stylesheets = accessibleStylesheets.filter((sheet) => sheet);
        // TODO listen to new
    }

    iterateRules(mapRule: (rule: CSSRule) => void) {
        function processGroupRule(rule: CSSGroupingRule) {
            for (let childRule of rule.cssRules) {
                mapRule(childRule);
                if ((childRule as CSSGroupingRule).cssRules) {
                    processGroupRule(childRule as CSSGroupingRule);
                }
            }
        }

        this.stylesheets.map((sheet) =>
            processGroupRule(sheet as unknown as CSSGroupingRule)
        );
    }

    async reenableOriginalStylesheets() {
        [...document.getElementsByClassName(disabledClassname)].map((elem) => {
            elem.classList.remove(disabledClassname);
            elem.disabled = false;
        });

        document
            .querySelectorAll(".lindy-stylesheet-proxy")
            .forEach((e) => e.remove());
    }
}

const disabledClassname = "lindylearn-disabled-style";
function disableStylesheet(elem, styleId) {
    elem.disabled = true;
    elem.classList.add(disabledClassname);
    elem.classList.add(styleId);
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
        console.error(`Error fetching CSS:`, response.err);
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

export function isStyleRule(rule: CSSRule): rule is CSSStyleRule {
    return rule.type === CSSRule.STYLE_RULE;
}
export function isSupportsRule(rule: CSSRule): rule is CSSSupportsRule {
    return rule.type === CSSRule.SUPPORTS_RULE;
}
export function isMediaRule(rule: CSSRule): rule is CSSMediaRule {
    return rule.type === CSSRule.MEDIA_RULE;
}
