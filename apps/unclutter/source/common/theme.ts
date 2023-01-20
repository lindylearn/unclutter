import { getBottomIframe, getOutlineIframe } from "../overlay/outline/components/common";
import { mergeUserTheme } from "./storage";

export type themeName = "auto" | "white" | "sepia" | "dark";

// persisted
export const fontSizeThemeVariable = "--lindy-active-font-size";
export const pageWidthThemeVariable = "--lindy-pagewidth";
export const activeColorThemeVariable = "--lindy-color-theme";

// computed
export const backgroundColorThemeVariable = "--lindy-background-color";
export const autoBackgroundThemeVariable = "--lindy-auto-background-color";
export const darkThemeTextColor = "--lindy-dark-theme-text-color";

export function saveThemeChange(domain, varName, value) {
    if (varName === fontSizeThemeVariable) {
        mergeUserTheme({ fontSize: value });
    } else if (varName === pageWidthThemeVariable) {
        mergeUserTheme({ pageWidth: value });
    } else if (varName === activeColorThemeVariable) {
        mergeUserTheme({ colorTheme: value });
    }
}

export function getThemeValue(varName) {
    return window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export function setCssThemeVariable(varName, value, params = {}) {
    // note: set on react apps via modifier methods (can't access cross-domain frames)
    // thus this function should only be called internally from ThemeModifier

    // To minimize rerenders, set CSS variables only on elements where they're used
    if (varName === fontSizeThemeVariable) {
        document.documentElement.style.setProperty(varName, value);
    } else if (varName === pageWidthThemeVariable) {
        document.documentElement.style.setProperty(varName, value);

        getBottomIframe()?.body.style.setProperty(varName, value);
    } else if (varName === backgroundColorThemeVariable) {
        if (!params["setOnlyUi"]) {
            document.body.style.setProperty("background", value, "important");
        }

        getOutlineIframe()?.body.style.setProperty(varName, value);
    } else if (varName === autoBackgroundThemeVariable || varName === activeColorThemeVariable) {
        document
            .getElementById("lindy-page-settings-toprght")
            ?.style.setProperty(autoBackgroundThemeVariable, value);
    } else if (varName === darkThemeTextColor) {
        if (!params["setOnlyUi"]) {
            document.documentElement.style.setProperty(varName, value);
        }

        getOutlineIframe()?.body.style.setProperty(varName, value);
    } else {
        document.documentElement.style.setProperty(varName, value);
    }
}

export function colorThemeToBackgroundColor(themeName) {
    // Get concrete color of selected theme
    if (themeName === "white") {
        return "white";
    } else if (themeName === "dark") {
        return "#212121";
    } else if (themeName === "sepia") {
        return "#F4ECD8"; // firefox sepia
    }
}
