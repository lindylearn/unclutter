import { getUserTheme } from "source/common/storage";
import { createStylesheetLink } from "source/common/stylesheets";
import {
    activeColorThemeVariable,
    applySaveThemeOverride,
    autoBackgroundThemeVariable,
    backgroundColorThemeVariable,
    colorThemeToBackgroundColor,
    fontSizeThemeVariable,
    pageWidthThemeVariable,
    setCssThemeVariable,
    themeName,
} from "source/common/theme";
import { HSLA, hslToString, parse, rgbToHSL } from "source/common/util/color";
import { highlightActiveColorThemeButton } from "source/content-script/overlay/insert";
import browser from "../../../common/polyfill";
import { PageModifier, trackModifierExecution } from "../_interface";
import CSSOMProvider, { isMediaRule, isStyleRule } from "./_provider";

@trackModifierExecution
export default class ThemeModifier implements PageModifier {
    private domain: string;
    private cssomProvider: CSSOMProvider;

    private activeColorTheme: themeName;
    private darkModeActive = false; // seperate from theme -- auto theme enables and disable dark mode

    constructor(cssomProvider: CSSOMProvider) {
        this.cssomProvider = cssomProvider;
    }

    private systemDarkModeQuery: MediaQueryList;
    async prepare(domain: string) {
        this.domain = domain;

        // Get saved domain-specific theme
        const theme = await getUserTheme();
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

        // Listen to system dark mode preference
        this.systemDarkModeQuery = window.matchMedia(
            "(prefers-color-scheme: dark)"
        );
        this.systemDarkModeQuery.addEventListener(
            "change",
            this.onSystemDarkThemeChange.bind(this)
        );
    }

    async afterTransitionIn() {
        await this.applyActiveColorTheme();
    }

    async transitionOut() {
        if (this.darkModeActive) {
            await this.disableDarkMode();
        }

        this.systemDarkModeQuery.removeEventListener(
            "change",
            this.onSystemDarkThemeChange.bind(this)
        );
    }

    private async onSystemDarkThemeChange({
        matches: isDarkMode,
    }: MediaQueryList) {
        await this.applyActiveColorTheme();
    }

    async changeColorTheme(newColorThemeName: themeName) {
        // apply theme change
        this.activeColorTheme = newColorThemeName;
        this.applyActiveColorTheme();

        // save in storage
        applySaveThemeOverride(
            this.domain,
            activeColorThemeVariable,
            newColorThemeName
        );
    }

    // also called from overlay theme selector
    private async applyActiveColorTheme() {
        // State for UI switch
        setCssThemeVariable(
            activeColorThemeVariable,
            this.activeColorTheme,
            true
        );
        highlightActiveColorThemeButton(this.activeColorTheme);

        await this.updateAutoModeColor();

        const prevDarkModeState = this.darkModeActive;
        this.darkModeActive = this.activeColorTheme === "dark";
        if (this.activeColorTheme === "auto") {
            this.darkModeActive = this.systemDarkModeQuery.matches;
        }

        // only enable or disable dark mode if there's been a change
        if (this.darkModeActive && !prevDarkModeState) {
            await this.enableDarkMode();
        } else if (!this.darkModeActive && prevDarkModeState) {
            await this.disableDarkMode();
        }
    }

    // Update auto state (shown in theme switcher)
    private async updateAutoModeColor() {
        if (this.systemDarkModeQuery.matches) {
            const darkColor = colorThemeToBackgroundColor("dark");
            setCssThemeVariable(autoBackgroundThemeVariable, darkColor, true);
        } else {
            const originalColor = colorThemeToBackgroundColor("auto");
            setCssThemeVariable(
                autoBackgroundThemeVariable,
                originalColor,
                true
            );
        }
    }

    private async enableDarkMode() {
        // Background color
        const concreteColor = colorThemeToBackgroundColor("dark");
        setCssThemeVariable(backgroundColorThemeVariable, concreteColor, true);

        // Text color
        setCssThemeVariable(
            "--lindy-dark-theme-text-color",
            "rgb(232, 230, 227)",
            true
        );

        // UI dark style
        createStylesheetLink(
            browser.runtime.getURL("content-script/pageview/contentDark.css"),
            "dark-mode-ui-style"
        );
        createStylesheetLink(
            browser.runtime.getURL("content-script/overlay/indexDark.css"),
            "dark-mode-ui-style"
        );

        // CSS tweaks for dark mode
        await this.enableDarkModeStyleTweaks();
    }

    private async disableDarkMode() {
        // Background color
        const concreteColor = colorThemeToBackgroundColor(
            this.activeColorTheme
        );
        setCssThemeVariable(backgroundColorThemeVariable, concreteColor, true);

        // undo dark mode style tweaks
        if (this.activeDarkModeStyleTweaks.length !== 0) {
            await this.disableDarkModeStyleTweaks();
        }

        document
            .querySelectorAll(".dark-mode-ui-style")
            .forEach((e) => e.remove());
    }

    private activeDarkModeStyleTweaks: [CSSStyleRule, object][] = [];
    private async enableDarkModeStyleTweaks() {
        // patch site stylesheet colors
        this.cssomProvider.iterateRules((rule) => {
            if (!isStyleRule(rule)) {
                return;
            }
            if (
                !rule.style.color &&
                !rule.style.backgroundColor &&
                !rule.style.boxShadow
            ) {
                return;
            }

            // save properties for restoration later
            const obj = {};
            for (const key of rule.style) {
                obj[key] = rule.style.getPropertyValue(key);
            }
            this.activeDarkModeStyleTweaks.push([rule, obj]);

            darkModeStyleRuleMap(rule);
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
