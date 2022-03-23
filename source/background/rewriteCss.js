import postcss, { Declaration } from "postcss";
import safeParser from "postcss-safe-parser";

// Perform various changes on a website's CSS to make it more readable
// This is run in the extension background script, on css links or inline text sent from content scripts.
export default async function fetchAndRewriteCss(params) {
    const { styleId, cssUrl, cssInlineText, baseUrl, conditionScale } = params;
    console.log(`Rewriting ${cssUrl || "inline style"} ${styleId}...`);

    try {
        let cssText = cssInlineText;
        if (cssUrl) {
            // Can't always use CSSOM api of link tags, so fetch files seperately.
            // This should usually hit the browser cache.
            const response = await fetch(cssUrl);
            cssText = await response.text();
        }

        const rewrittenText = await rewriteCss(
            cssText,
            baseUrl,
            conditionScale
        );

        // return results for content scripts
        return {
            status: "success",
            css: rewrittenText,
        };
    } catch (err) {
        console.error(err);
        return {
            status: "error",
            err,
        };
    }
}

// Rewrite CSS text using custom postcss plugins defined below
export async function rewriteCss(cssText, baseUrl, conditionScale) {
    const plugins = [
        scaleBreakpointsPlugin(conditionScale),
        urlRewritePlugin(baseUrl),
        hideFixedElementsPlugin,
        styleTweaksPlugin,
    ];

    const result = await postcss(plugins).process(cssText, {
        parser: safeParser,
    });

    return result.css;
}

/**
 * This extension reduces the width of displayed webpages by setting a max-width on <body>.
 * However since CSS media queries use the actual browser viewport width, responsive styles
 * won't take this changed body width into account.
 *
 * So change those CSS media query conditions to use upscaled viewport width breakpoints.
 *
 * Assuming scale factor 2 (page now takes up only 50% of the screen):
 *   @media (max-width 1) -> @media (max-width 2)
 *   @media (min-width 1) -> @media (min-width 2)
 *      Since the original style is disabled after the rewritten one is enabled, we don't need to
 *      negate style in the [1, 2] width range.
 */
const scaleBreakpointsPlugin = (conditionScale) => ({
    postcssPlugin: "scale-media-breakpoints",
    AtRule(rule) {
        if (rule.name === "media") {
            // any change will re-trigger listeners
            if (rule["alreadyProcessed"]) {
                return;
            }

            rule.params = scaleString(rule.params, conditionScale);
            rule["alreadyProcessed"] = true;
        }
    },
    Declaration(decl) {
        if (
            (decl.prop === "width" || decl.prop === "min-width") &&
            decl.value.includes("vw")
        ) {
            if (decl["alreadyProcessed"]) {
                return;
            }

            // hack: remove vw rules for now (mostly used to add side margin, which we already add elsewhere)
            // conditionScale is not neccessarily equal to actual pageview with, so not correct margin
            decl.remove();

            decl["alreadyProcessed"] = true;
        }
    },
});
scaleBreakpointsPlugin.postcss = true;
function scaleString(string, conditionScale) {
    for (const match of string.matchAll(/([0-9]+)/g)) {
        const oldCount = parseInt(match[1]);
        const newCount = Math.round(conditionScale * oldCount);

        string = string.replace(oldCount.toString(), newCount.toString());
    }
    return string;
}

// use absolute paths for files referenced via url()
// those paths are relative to the stylesheet url, which we change
const urlRewritePlugin = (baseUrl) => ({
    postcssPlugin: "rewrite-relative-urls",
    AtRule(rule) {
        if (rule.name === "import") {
            // e.g. 'file.css', file.css, url(file.css), url("file.css")
            const url = rule.params.match(
                /^(?:url\()?"?'?([^'"\)]*)"?'?\)?/
            )?.[1];
            const absoluteUrl = new URL(url, baseUrl);
            rule.params = rule.params.replace(url, absoluteUrl.href);
        }
    },
    Declaration(decl) {
        if (decl.value.startsWith("url(")) {
            // any change will re-trigger listeners
            if (decl["alreadyProcessed"]) {
                return;
            }
            // short-circuit base64 urls for performance
            if (decl.value.startsWith("url(data:")) {
                return;
            }

            let newValue = decl.value;
            for (const match of decl.value.matchAll(
                /url\((?!"?'?(?:data:|#|https?:\/\/))"?'?([^\)]*?)"?'?\)/g
            )) {
                const url = match[1];
                const absoluteUrl = new URL(url, baseUrl);
                newValue = newValue.replace(url, absoluteUrl.href);
            }

            decl.value = newValue;
            decl["alreadyProcessed"] = true;
        }
    },
});
urlRewritePlugin.postcss = true;

// hide fixed and sticky positioned elements (highly unlikely to be part of the readable text)
const hideFixedElementsPlugin = {
    postcssPlugin: "hide-fixed-elements",
    Rule(rule) {
        if (rule.selector === "body") {
            rule.each((node) => {
                if (node.type === "decl" && node.prop.startsWith("margin")) {
                    node.prop = node.prop.replace("margin", "padding");
                }
            });
        }
    },
    Declaration(decl) {
        if (
            decl.prop === "position" &&
            (decl.value === "fixed" || decl.value === "sticky")
        ) {
            decl.parent.append(
                new Declaration({
                    prop: "display",
                    value: "none",
                    important: true,
                })
            );
        }
    },
};

// other small style tweaks to improve the pageview display
const styleTweaksPlugin = {
    postcssPlugin: "style-tweaks",
    Rule(rule) {
        // rewrite body margin (which we overwrite) into padding
        if (rule.selector === "body") {
            rule.each((node) => {
                if (node.type === "decl" && node.prop.startsWith("margin")) {
                    // caveat: this uses either margin or padding if present, does not add them
                    node.prop = node.prop.replace("margin", "padding");
                }
            });
        }
    },
    Declaration(decl) {
        // force scroll at body element
        if (decl.prop === "height" && decl.value === "100vh") {
            decl.value = "100%";
        }
    },
};
