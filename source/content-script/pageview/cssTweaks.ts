import axios from "axios";
import css from "css";

// The extension reduces the website body width to show annotations on the right side.
// But since CSS media queries work on the actual viewport width, responsive style doesn't take this reduced body width into account.
// So parse the website CSS here and return media queries with the correct width breakpoints.
export async function getCssOverride(
    cssUrl: string,
    conditionScale: number
): Promise<string> {
    // Fetch remote CSS
    const response = await axios.get(cssUrl, { responseType: "blob" });
    const cssText: string = await response.data.text();
    const rules = css.parse(cssText)?.stylesheet?.rules;
    if (!rules) {
        return;
    }

    // Filter media rules
    const textLines = cssText.split("\n");
    const mediaRules = rules
        .filter((rule: any) => rule.type === "media")
        .map((rule: any) => {
            let text = "";
            if (rule.position.start.line === rule.position.end.line) {
                text = textLines[rule.position.start.line - 1].slice(
                    rule.position.start.column - 1,
                    rule.position.end.column - 1
                );
            } else {
                text =
                    textLines[rule.position.start.line - 1].slice(
                        rule.position.start.column - 1
                    ) +
                    "\n" +
                    textLines
                        .slice(
                            rule.position.start.line,
                            rule.position.end.line - 1
                        )
                        .join("\n") +
                    "\n" +
                    textLines[rule.position.end.line - 1].slice(
                        0,
                        rule.position.end.column - 1
                    );
            }

            return {
                condition: rule.media as string,
                text,
            };
        });

    // Create override rules
    const overrideRules = mediaRules
        .map((rule: any) => {
            const oldPxCount = parseInt(
                /([0-9]+)px/g.exec(rule.condition)?.[1] as string
            );
            if (!oldPxCount) {
                // rule not mentioning screen sizes, e.g. 'print'
                return;
            }
            const newPxCount = Math.round(conditionScale * oldPxCount);

            const newCondition = rule.condition.replace(
                `${oldPxCount}px`,
                `${newPxCount}px`
            );
            const newRuleText = rule.text.replace(rule.condition, newCondition);
            return newRuleText;
        })
        .filter((t: string) => t);

    // construct one override document per CSS document
    return overrideRules.join("\n\n");
}
