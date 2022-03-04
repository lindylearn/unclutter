import * as functions from "firebase-functions";
import * as cors from "cors";
import axios from "axios";
// @ts-ignore
import * as css from "css";

const corsWrapper = cors({ origin: true });

export const getCssOverrides = functions.https.onRequest((req, res) =>
    corsWrapper(req, res, async () => {
        const cssUrl = req.query.cssUrl as string;
        const conditionScale = parseFloat(req.query.conditionScale as string);
        if (!cssUrl || !conditionScale) {
            res.status(400).json();
            return;
        }

        const response = await axios.get(cssUrl, { responseType: "blob" });
        const cssText: string = response.data;
        const rules = css.parse(cssText)?.stylesheet?.rules;
        if (!rules) {
            res.status(400).json();
            return;
        }

        const textLines = cssText.split("\n");
        const mediaRules = rules
            .filter((rule: any) => rule.type === "media")
            .map((rule: any) => {
                console.log(rule.position);
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
                const newRuleText = rule.text.replace(
                    rule.condition,
                    newCondition
                );
                return newRuleText;
            })
            .filter((t: string) => t);

        res.setHeader("content-type", "text/css");
        res.send(overrideRules.join("\n\n"));
    })
);
