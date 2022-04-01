import { getDomainUserTheme } from "source/common/storage";
import {
    activeColorThemeVariable,
    backgroundColorThemeVariable,
    colorThemeToBackgroundColor,
    fontSizeThemeVariable,
    pageWidthThemeVariable,
    setCssThemeVariable,
    themeName,
} from "source/common/theme";
import { HSLA, hslToString, parse, rgbToHSL } from "source/common/util/color";
import { highlightActiveColorThemeButton } from "source/content-script/overlay/insert";
import { PageModifier, trackModifierExecution } from "../_interface";
import CSSOMProvider, { isStyleRule } from "./_provider";

@trackModifierExecution
export default class ThemeModifier implements PageModifier {
    private cssomProvider: CSSOMProvider;
    private activeColorTheme: themeName;

    constructor(cssomProvider: CSSOMProvider) {
        this.cssomProvider = cssomProvider;
    }

    async prepare(domain: string) {
        // Get saved domain-specific theme
        const theme = await getDomainUserTheme(domain);
        if (!theme) {
            return;
        }
        if (theme.fontSize) {
            setCssThemeVariable(fontSizeThemeVariable, theme.fontSize, true);
        }
        if (theme.pageWidth) {
            setCssThemeVariable(pageWidthThemeVariable, theme.pageWidth, true);
        }

        this.activeColorTheme = theme.colorTheme;
        if (!this.activeColorTheme) {
            this.activeColorTheme = "auto";
        }
    }

    async afterTransitionIn() {
        await this.applyColorTheme(this.activeColorTheme);
    }

    // also called from overlay theme selector
    async applyColorTheme(colorThemeName: themeName) {
        // State for UI switch
        setCssThemeVariable(activeColorThemeVariable, colorThemeName, true);
        highlightActiveColorThemeButton(colorThemeName);

        // Background color
        const concreteColor = colorThemeToBackgroundColor(colorThemeName);
        setCssThemeVariable(backgroundColorThemeVariable, concreteColor, true);

        if (colorThemeName === "dark") {
            setCssThemeVariable(
                "--lindy-dark-theme-text-color",
                "rgb(232, 230, 227)",
                true
            );

            // CSS tweaks for dark mode
            await this.enableDarkModeStyleTweaks();
        } else if (this.activeDarkModeStyleTweaks.length !== 0) {
            // undo dark mode style tweaks
            await this.disableDarkModeStyleTweaks();
        }
    }

    async transitionOut() {
        if (this.activeColorTheme === "dark") {
            await this.disableDarkModeStyleTweaks();
        }
    }

    private activeDarkModeStyleTweaks: [CSSStyleRule, object][] = [];
    private async enableDarkModeStyleTweaks() {
        // patch site stylesheet colors
        this.cssomProvider.stylesheets.map((sheet) => {
            for (let rule of sheet.cssRules) {
                if (!isStyleRule(rule)) {
                    continue;
                }
                if (
                    !rule.style.color &&
                    !rule.style.backgroundColor &&
                    !rule.style.boxShadow
                ) {
                    continue;
                }

                // save properties for restoration later
                // TODO measure performance of this
                const obj = {};
                for (const key of rule.style) {
                    obj[key] = rule.style.getPropertyValue(key);
                }
                this.activeDarkModeStyleTweaks.push([rule, obj]);

                darkModeStyleRuleMap(rule);
            }
        });
    }

    private async disableDarkModeStyleTweaks() {
        this.activeDarkModeStyleTweaks.map(([rule, originalStyle]) => {
            for (const [key, value] of Object.entries(originalStyle)) {
                rule.style.setProperty(key, value);
            }
        });
    }
}

function darkModeStyleRuleMap(rule: CSSStyleRule) {
    if (rule.style.color) {
        rule.style.setProperty(
            "color",
            changeTextColor(rule.style.color, rule.selectorText),
            rule.style.getPropertyPriority("color")
        );
    }
    if (rule.style.backgroundColor) {
        rule.style.setProperty(
            "background-color",
            changeBackgroundColor(
                rule.style.backgroundColor,
                rule.selectorText
            ),
            rule.style.getPropertyPriority("background-color")
        );
    }

    if (rule.style.boxShadow) {
        rule.style.removeProperty("box-shadow");
    }

    // TODO parse CSS variables better, e.g. ones set via JS or inline styles
    if (
        rule.selectorText === ":root" ||
        rule.selectorText === "*, :after, :before" // tailwind
    ) {
        for (const key of rule.style) {
            if (key.startsWith("--")) {
                const value = rule.style.getPropertyValue(key);

                // ideally transform the variables where used
                if (key.includes("background")) {
                    rule.style.setProperty(
                        key,
                        changeBackgroundColor(value, rule.selectorText)
                    );
                } else {
                    rule.style.setProperty(
                        key,
                        changeTextColor(value, rule.selectorText)
                    );
                }
            }
        }
    }
}

// TODO cache

function changeTextColor(colorString: string, selectorText): string {
    if (colorString === "initial") {
        return "var(--lindy-dark-theme-text-color)";
    }

    const hslColor = parseHslColor(colorString);
    if (!hslColor) {
        return colorString;
    }

    let newColor = colorString;
    if (hslColor.l < 0.4) {
        // main text
        // standardize most text around this

        // l e.g. 0.35 at https://fly.io/blog/a-foolish-consistency/
        newColor = "var(--lindy-dark-theme-text-color)";
    } else {
        // make other colors more visible

        if (hslColor.s > 0.9) {
            hslColor.s = 0.9;
        }
        if (hslColor.l < 0.6) {
            hslColor.l = 0.6;
        }

        newColor = hslToString(hslColor);
    }

    // console.log(
    //     `%c     %c -> %c     %c\t${hslToString(
    //         parseHslColor(colorString)
    //     )}\t -> ${newColor} \t${selectorText}`,
    //     `background: ${colorString}`,
    //     `background: inherit`,
    //     `background: ${newColor}`,
    //     `background: inherit`
    // );
    return newColor;
}

function changeBackgroundColor(colorString: string, selectorText) {
    const hslColor = parseHslColor(colorString);
    if (!hslColor) {
        return colorString;
    }

    let newColor = colorString;
    if (hslColor.l > 0.8) {
        // main background
        // show through background element
        newColor = "transparent";
    } else {
        // darken other colors

        if (hslColor.s > 0.7) {
            hslColor.s = 0.7;
        }
        if (hslColor.l > 0.2) {
            hslColor.l = 0.2;
        }

        newColor = hslToString(hslColor);
    }

    // console.log(
    //     `%c     %c -> %c     %c\t${hslToString(
    //         parseHslColor(colorString)
    //     )}\t -> ${newColor} \t${selectorText}`,
    //     `background: ${colorString}`,
    //     `background: inherit`,
    //     `background: ${newColor}`,
    //     `background: inherit`
    // );
    return newColor;
}

const unparsableColors = new Set([
    "inherit",
    "transparent",
    "initial",
    "currentcolor",
    "none",
    "unset",
]);
function parseHslColor(colorString: string): HSLA | null {
    if (unparsableColors.has(colorString.toLowerCase())) {
        return null;
    }
    if (colorString.includes("var(")) {
        // remove for now
        // could still be a valid color string, e.g. rgb(59 130 246/var(--x)) at https://fly.io/blog/a-foolish-consistency/
        colorString = colorString.replace(/var\(--.*?\)/, "");
    }

    try {
        const rgbColor = parse(colorString);
        return rgbToHSL(rgbColor);
    } catch (err) {
        // console.error(colorString, err);
        return null;
    }
}
