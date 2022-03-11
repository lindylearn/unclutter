import css from "css";

// The extension reduces the website body width to show annotations on the right side.
// But since CSS media queries work on the actual viewport width, responsive style doesn't take this reduced body width into account.
// So parse the website CSS here and return media queries with the correct width breakpoints.
export async function getCssOverride(
    cssUrl: string,
    cssText: string,
    conditionScale: number
): Promise<string> {
    const rules = getRules(cssText);
    if (!rules) {
        return;
    }

    const baseRules = rules
        .filter((rule: any) => rule.type !== "media")
        .map((r) => r.text);

    /**
     * Create override media rules upscaled to the entire page.
     * Assuming scale factor 2 (page now takes up only 50% of the screen):
     *     max-width 1 -> max-width 2
     *     min-width 1 -> min-width 2
     *         since we remove the old style, no need to negate old [1, 2] range
     */
    const overrideRules = rules
        .filter((rule: any) => rule.type === "media")
        .map((rule: any) => {
            let newCondition = rule.condition;

            for (const match of newCondition.matchAll(/([0-9]+)/g)) {
                const oldCount = parseInt(match[1]);
                const newCount = Math.round(conditionScale * oldCount);

                newCondition = newCondition.replace(oldCount, newCount);
            }

            let newText = rule.text.replace(rule.condition, newCondition);
            if (rule.wrappedBySelector) {
                newText = `${rule.wrappedBySelector} { ${newText} }`;
            }
            return newText;
        })
        .filter((text: string) => text);

    let newText = baseRules
        .concat(overrideRules)
        .map((text) => modifyRulesText(text, cssUrl))
        .join("\n\n");

    // console.log(cssUrl, newText);

    // construct one override document per CSS document
    return newText;
}

function getRules(text: string) {
    const rules = css.parse(text, { silent: true })?.stylesheet?.rules;
    if (!rules) {
        return;
    }

    const textLines = text.split("\n");
    const mappedRules = rules.map((rule: any) =>
        mapRuleFormat(rule, textLines)
    );

    // rules wrapped by non-media rules, e.g. @supports (...) {}
    // assume only one level nesting
    const nonWrappedRules = mappedRules.filter(
        (rule: any) => !rule.rules || rule.type === "media"
    );
    const wrappedRules = mappedRules
        .filter((rule: any) => rule.rules && rule.type !== "media")
        .flatMap((wrapper) => {
            const wrappedBySelector = wrapper.text.match(/(.*?)\{/)[1];

            return wrapper.rules.map((rule) => {
                const mappedRule = mapRuleFormat(rule, textLines);
                return {
                    ...mappedRule,
                    wrappedBySelector,
                };
            });
        });

    return nonWrappedRules.concat(wrappedRules);
}

function mapRuleFormat(rule: any, completeTextLines: string[]) {
    let text = "";
    if (rule.position.start.line === rule.position.end.line) {
        text = completeTextLines[rule.position.start.line - 1].slice(
            rule.position.start.column - 1,
            rule.position.end.column - 1
        );
    } else {
        text =
            completeTextLines[rule.position.start.line - 1].slice(
                rule.position.start.column - 1
            ) +
            "\n" +
            completeTextLines
                .slice(rule.position.start.line, rule.position.end.line - 1)
                .join("\n") +
            "\n" +
            completeTextLines[rule.position.end.line - 1].slice(
                0,
                rule.position.end.column - 1
            );
    }

    return {
        type: rule.type,
        condition: rule.media as string,
        selectors: rule.selectors,
        rules: rule.rules,
        text,
    };
}

function modifyRulesText(text, cssUrl) {
    // use absolute paths for files referenced via url()
    // those paths are relative to the stylesheet url, which we change
    for (const match of text.matchAll(
        /url\((?!"?'?(?:data:|#|https?:\/\/))"?'?([^\)]*?)"?'?\)/g
    )) {
        const url = match[1];

        const absoluteUrl = new URL(url, cssUrl);
        text = text.replace(url, absoluteUrl.href);
    }

    // hide fixed and sticky positioned elements (highly unlikely to be part of the text)
    text = text.replaceAll(
        /position:\s?fixed\s?(\!important)?/g,
        "position: fixed; display: none !important"
    );
    text = text.replaceAll(
        /position:\s?sticky\s?(\!important)?/g,
        "position: sticky; display: none !important"
    );

    return text;
}
