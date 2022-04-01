import { mergeDomainUserTheme } from "./storage";

export type themeName = "auto" | "white" | "sepia" | "dark";

// persisted
export const fontSizeThemeVariable = "--lindy-active-font-size";
export const pageWidthThemeVariable = "--lindy-pagewidth";
export const activeColorThemeVariable = "--lindy-color-theme";

// computed
export const backgroundColorThemeVariable = "--lindy-background-color";
export const originalBackgroundThemeVariable =
    "--lindy-original-background-color";

export function applySaveThemeOverride(domain, varName, value) {
    if (varName === fontSizeThemeVariable) {
        setCssThemeVariable(varName, value, true);

        mergeDomainUserTheme(domain, { fontSize: value });
    } else if (varName === pageWidthThemeVariable) {
        setCssThemeVariable(varName, value, true);

        mergeDomainUserTheme(domain, { pageWidth: value });
    } else if (varName === activeColorThemeVariable) {
        setCssThemeVariable(activeColorThemeVariable, value, true);

        const concreteColor = colorThemeToBackgroundColor(value);
        setCssThemeVariable(backgroundColorThemeVariable, concreteColor, true);

        mergeDomainUserTheme(domain, { colorTheme: value });
    }
}

export function getThemeValue(varName) {
    return window
        .getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
}

export function setCssThemeVariable(varName, value, overwrite = false) {
    const prevValue = getThemeValue(varName);
    if (prevValue && !overwrite) {
        // Don't overwrite explicit user theme with config parsed from page
        return;
    }

    document.documentElement.style.setProperty(varName, value);
}

export function colorThemeToBackgroundColor(themeName) {
    // Get concrete color of selected theme
    if (themeName === "white") {
        return "white";
    } else if (themeName === "dark") {
        return "#131516";
    } else if (themeName === "sepia") {
        return "#F4ECD8"; // firefox sepia
    } else if (themeName === "auto") {
        return getThemeValue(originalBackgroundThemeVariable);
    }
}
