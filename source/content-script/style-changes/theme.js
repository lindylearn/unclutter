import { getDomainUserTheme, mergeDomainUserTheme } from "../../common/storage";

export async function initTheme(domain) {
    // Get saved domain-specific theme
    const theme = await getDomainUserTheme(domain);
    if (!theme) {
        return;
    }

    // Apply by setting / overwriting CSS variables
    if (theme.fontSize) {
        setCssThemeVariable(fontSizeThemeVariable, theme.fontSize, true);
    }
    if (theme.pageWidth) {
        setCssThemeVariable(pageWidthThemeVariable, theme.pageWidth, true);
    }
}

export const fontSizeThemeVariable = "--lindy-active-font-size";
export const pageWidthThemeVariable = "--lindy-pagewidth";

export function applySaveThemeOverride(domain, varName, value) {
    // Apply theme change on page
    setCssThemeVariable(varName, value, true);

    // Save in storage
    if (varName === fontSizeThemeVariable) {
        mergeDomainUserTheme(domain, { fontSize: value });
    }
    if (varName === pageWidthThemeVariable) {
        mergeDomainUserTheme(domain, { pageWidth: value });
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
