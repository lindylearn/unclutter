import browser from "../../../common/polyfill";
import { getUserTheme } from "../../../common/storage";
import { createStylesheetLink } from "../../../common/stylesheets";
import {
    activeColorThemeVariable,
    applySaveThemeOverride,
    autoBackgroundThemeVariable,
    backgroundColorThemeVariable,
    colorThemeToBackgroundColor,
    darkThemeTextColor,
    fontSizeThemeVariable,
    pageWidthThemeVariable,
    setCssThemeVariable,
    themeName,
} from "../../../common/theme";
import {
    getSRGBLightness,
    HSLA,
    hslToString,
    parse,
    rgbToHSL,
} from "../../../common/util/color";
import { highlightActiveColorThemeButton } from "../../../overlay/insert";
import { getOutlineIframe } from "../../../overlay/outline/common";
import AnnotationsModifier from "../annotations/annotationsModifier";
import TextContainerModifier from "../DOM/textContainer";
import { PageModifier, trackModifierExecution } from "../_interface";
import CSSOMProvider, { isMediaRule, isStyleRule } from "./_provider";

@trackModifierExecution
export default class ThemeModifier implements PageModifier {
    private domain: string;
    private cssomProvider: CSSOMProvider;
    private annotationsModifer: AnnotationsModifier;
    private textContainerModifier: TextContainerModifier;

    private activeColorTheme: themeName;
    private darkModeActive = false; // seperate from theme -- auto theme enables and disable dark mode

    constructor(
        cssomProvider: CSSOMProvider,
        annotationsModifer: AnnotationsModifier,
        textContainerModifier: TextContainerModifier
    ) {
        this.cssomProvider = cssomProvider;
        this.annotationsModifer = annotationsModifer;
        this.textContainerModifier = textContainerModifier;
    }

    private systemDarkModeQuery: MediaQueryList;
    async prepare(domain: string) {
        this.domain = domain;

        // Get saved domain-specific theme
        const theme = await getUserTheme();
        if (!theme) {
            return;
        }
        if (theme.pageWidth) {
            setCssThemeVariable(pageWidthThemeVariable, theme.pageWidth);
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

    async transitionIn() {
        // basic heuristic whether to enable dark mode, to show it earlier
        const darkModeActive =
            this.darkModeActive ||
            this.activeColorTheme === "dark" ||
            (this.activeColorTheme === "auto" &&
                this.systemDarkModeQuery.matches);
        if (darkModeActive) {
            document.documentElement.style.setProperty(
                "background",
                "#131516",
                "important"
            );
            document.body.style.setProperty(
                "background",
                colorThemeToBackgroundColor("dark"),
                "important"
            );
        }

        // prepare configured text size for later
        const theme = await getUserTheme();
        if (theme.fontSize) {
            setCssThemeVariable(fontSizeThemeVariable, theme.fontSize);
        }
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
        setCssThemeVariable(activeColorThemeVariable, this.activeColorTheme);
        highlightActiveColorThemeButton(this.activeColorTheme);

        // Determine if should use dark mode
        const prevDarkModeState = this.darkModeActive;
        this.darkModeActive = this.activeColorTheme === "dark";
        if (this.activeColorTheme === "auto") {
            this.darkModeActive = this.systemDarkModeQuery.matches;
        }

        // Specical processing of original website colors
        let siteUsesDefaultDarkMode = false;
        // Disable default site dark mode detection for now
        // The user likely doesn't expect the auto-change

        const rgbColor = parse(
            this.textContainerModifier.originalBackgroundColor
        );
        const brightness = getSRGBLightness(rgbColor.r, rgbColor.g, rgbColor.b);
        // console.log(brightness);
        if (brightness > 0.96 && !this.darkModeActive) {
            // Too light colors conflict with white theme, so set to white
            this.textContainerModifier.originalBackgroundColor = "white";
        } else if (brightness < 0.1) {
            // Uses dark mode by default, but too dark so use default background color
            // e.g. https://wale.id.au/posts/iviewed-your-api-keys/
            this.darkModeActive = true;
            this.textContainerModifier.originalBackgroundColor =
                colorThemeToBackgroundColor("dark");
        } else if (brightness < 0.3) {
            // Site uses dark mode by default
            // OR we picked a differently-colored banner as background

            // need to do something, otherwise rest of ui doesn't work with parsed original background color
            // e.g. https://joeblu.com/blog/2022_05_okrs/

            // Make rest of UI dark
            this.darkModeActive = true;

            // caution: this is error prone
            siteUsesDefaultDarkMode = true;
        }

        // enable or disable dark mode if there's been a change
        if (this.darkModeActive && !prevDarkModeState) {
            await this.enableDarkMode(siteUsesDefaultDarkMode);
        } else if (!this.darkModeActive && prevDarkModeState) {
            await this.disableDarkMode();
        }

        // apply other background colors
        if (!this.darkModeActive) {
            let concreteColor: string;
            if (this.activeColorTheme === "auto") {
                concreteColor =
                    this.textContainerModifier.originalBackgroundColor;
            } else {
                concreteColor = colorThemeToBackgroundColor(
                    this.activeColorTheme
                );
            }
            setCssThemeVariable(backgroundColorThemeVariable, concreteColor);
            this.annotationsModifer.setSidebarCssVariable(
                backgroundColorThemeVariable,
                concreteColor
            );
        }

        await this.updateAutoModeColor();
    }

    // Update auto state (shown in theme switcher)
    private async updateAutoModeColor() {
        if (this.systemDarkModeQuery.matches) {
            const darkColor = colorThemeToBackgroundColor("dark");
            setCssThemeVariable(autoBackgroundThemeVariable, darkColor);
        } else {
            setCssThemeVariable(
                autoBackgroundThemeVariable,
                this.textContainerModifier.originalBackgroundColor
            );
        }
    }

    private async enableDarkMode(siteUsesDefaultDarkMode = false) {
        // UI dark style
        createStylesheetLink(
            browser.runtime.getURL("content-script/pageview/contentDark.css"),
            "dark-mode-ui-style",
            // insert at beginning of header to not override site dark styles
            document.head.firstChild as HTMLElement
        );
        createStylesheetLink(
            browser.runtime.getURL("overlay/indexDark.css"),
            "dark-mode-ui-style"
        );
        createStylesheetLink(
            browser.runtime.getURL("overlay/outline/outlineDark.css"),
            "dark-mode-ui-style",
            getOutlineIframe()?.head.lastChild as HTMLElement
        );
        this.annotationsModifer.setSidebarDarkMode(true);

        const siteSupportsDarkMode = this.detectSiteDarkMode(true);
        if (siteUsesDefaultDarkMode) {
            // TODO is this too error prone?

            // use default background elsewhere
            setCssThemeVariable(
                backgroundColorThemeVariable,
                this.textContainerModifier.originalBackgroundColor
            );
            this.annotationsModifer.setSidebarCssVariable(
                backgroundColorThemeVariable,
                this.textContainerModifier.originalBackgroundColor
            );
        } else if (siteSupportsDarkMode) {
            // parse background color, which we overwrite
            let backgroundColor: string;
            this.enabledSiteDarkModeRules.map((mediaRule) => {
                for (const styleRule of mediaRule.cssRules) {
                    if (!isStyleRule(styleRule)) {
                        return;
                    }

                    if (styleRule.style.background) {
                        backgroundColor = styleRule.style.background;
                    }
                }
            });

            if (!backgroundColor) {
                // this may not always work (e.g. if css variables are used), so use default fallback
                backgroundColor = colorThemeToBackgroundColor("dark");
            }

            setCssThemeVariable(backgroundColorThemeVariable, backgroundColor);
            this.annotationsModifer.setSidebarCssVariable(
                backgroundColorThemeVariable,
                backgroundColor
            );

            if (this.activeColorTheme === "auto") {
                setCssThemeVariable(
                    autoBackgroundThemeVariable,
                    backgroundColor
                );
            }
        } else {
            // set root text color now (setting it always would override other styles)
            this.textContainerModifier.setTextDarkModeVariable(true);

            // Background color
            const concreteColor = colorThemeToBackgroundColor("dark");
            setCssThemeVariable(backgroundColorThemeVariable, concreteColor);
            this.annotationsModifer.setSidebarCssVariable(
                backgroundColorThemeVariable,
                concreteColor
            );

            await this.enableDarkModeStyleTweaks();
        }

        // always dark text color for ui elements
        const darkTextColor = "rgb(232, 230, 227)";
        setCssThemeVariable(darkThemeTextColor, darkTextColor, {
            setOnlyUi: true,
        });
        this.annotationsModifer.setSidebarCssVariable(
            darkThemeTextColor,
            darkTextColor
        );
    }

    private async disableDarkMode() {
        document.documentElement.style.removeProperty("color");
        document.documentElement.style.removeProperty("background");
        document.documentElement.style.removeProperty(darkThemeTextColor);
        this.textContainerModifier.setTextDarkModeVariable(false);

        // undo dark mode style tweaks
        await this.disableDarkModeStyleTweaks();

        document
            .querySelectorAll(".dark-mode-ui-style")
            .forEach((e) => e.remove());

        getOutlineIframe()
            ?.querySelectorAll(".dark-mode-ui-style")
            .forEach((e) => e.remove());

        this.annotationsModifer.setSidebarDarkMode(false);
    }

    private enabledSiteDarkModeRules: CSSMediaRule[] = [];
    private detectSiteDarkMode(enableIfFound = false) {
        let siteSupportsDarkMode = false;

        // iterate only top level for performance
        // also don't iterate the rules we added
        this.cssomProvider.stylesheets.map((sheet) => {
            for (const rule of sheet.cssRules) {
                if (!isMediaRule(rule)) {
                    continue;
                }
                if (
                    !rule.media.mediaText.includes("prefers-color-scheme: dark")
                ) {
                    continue;
                }

                siteSupportsDarkMode = true;

                if (enableIfFound) {
                    // insert rule copy that's always active
                    const newCssText = `@media screen ${rule.cssText.replace(
                        /@media[^{]*/,
                        ""
                    )}`;
                    const newIndex = rule.parentStyleSheet.insertRule(
                        newCssText,
                        rule.parentStyleSheet.cssRules.length
                    );
                    const newRule = rule.parentStyleSheet.cssRules[newIndex];
                    this.enabledSiteDarkModeRules.push(newRule as CSSMediaRule);
                }
            }
        });

        return siteSupportsDarkMode;
    }

    private activeDarkModeStyleTweaks: [CSSStyleRule, object][] = [];
    private async enableDarkModeStyleTweaks() {
        // patch site stylesheet colors
        this.cssomProvider.iterateRules((rule) => {
            if (!isStyleRule(rule)) {
                return;
            }

            const modifications = darkModeStyleRuleMap(rule);
            if (modifications) {
                // save properties for restoration later
                const obj = {};
                for (const key of rule.style) {
                    obj[key] = rule.style.getPropertyValue(key);
                }
                this.activeDarkModeStyleTweaks.push([rule, obj]);

                // apply modifications
                for (const [key, val] of Object.entries(modifications)) {
                    rule.style.setProperty(
                        key,
                        val,
                        rule.style.getPropertyPriority(key)
                    );
                }
            }
        });
    }

    private async disableDarkModeStyleTweaks() {
        this.activeDarkModeStyleTweaks.map(([rule, originalStyle]) => {
            for (const [key, value] of Object.entries(originalStyle)) {
                rule.style.setProperty(key, value);
            }
        });
        this.activeDarkModeStyleTweaks = [];

        this.enabledSiteDarkModeRules.map((mediaRule) => {
            for (const styleRule of mediaRule.cssRules) {
                styleRule.style = {};
            }
        });
        this.enabledSiteDarkModeRules = [];
    }
}

function darkModeStyleRuleMap(rule: CSSStyleRule): object {
    const modifications = {};

    if (rule.style.color) {
        modifications["color"] = changeTextColor(
            rule.style.color,
            rule.selectorText
        );
    }
    if (rule.style.backgroundColor) {
        modifications["background-color"] = changeBackgroundColor(
            rule.style.backgroundColor,
            rule.selectorText
        );
    }

    if (rule.style.boxShadow) {
        modifications["box-shadow"] = "none";
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
                    modifications[key] = changeBackgroundColor(
                        value,
                        rule.selectorText
                    );
                } else {
                    modifications[key] = changeTextColor(
                        value,
                        rule.selectorText
                    );
                }
            }
        }
    }

    return modifications;
}

// TODO cache

function changeTextColor(colorString: string, selectorText): string {
    if (colorString === "initial") {
        return `var(${darkThemeTextColor})`;
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
        newColor = `var(${darkThemeTextColor})`;
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
    //     `%c     %c -> %c     %c\t${colorString}\t -> ${newColor} \t${selectorText}`,
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
