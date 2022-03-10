import { createStylesheetText } from "./styleChanges";

// hide page elements unrelated to the article
export function contentBlock() {
    const tagSelectors = blockedTags;
    const classSelectors = blockedWords.map((word) => `[class*=${word} i]`);
    const idSelectors = blockedWords.map((word) => `[id*=${word} i]`);
    const roleSelectors = blockedWords.map((word) => `[role*=${word} i]`);

    const selectors = tagSelectors
        .concat(classSelectors)
        .concat(idSelectors)
        .concat(roleSelectors);
    const css = `${selectors.join(", ")} { display: none !important; }`;

    createStylesheetText(css);
}

// inserted stylesheets are already removed elsewhere
export function unContentBlock() {}

const blockedTags = ["footer", "aside", "nav"];
const blockedWords = [
    "masthead",
    "banner",
    "menu",
    // "sidebar",
    "footer",
    "comments",
    "related",
    "recommendation",
    "social",
    "popular",
    "promo",
    "overlay",
    "login",
    "registration",
    "modal",
    "cookie",
    "consent",
];
