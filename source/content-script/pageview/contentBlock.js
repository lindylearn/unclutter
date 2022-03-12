import { createStylesheetText } from "./styleChanges";

// hide page elements unrelated to the article
export function insertContentBlockStyle() {
    const tagSelectors = blockedTags;
    const classSelectors = blockedWords.map(
        (word) => `*:not(body)[class*=${word} i]`
    );
    const idSelectors = blockedWords.map((word) => `[id*=${word} i]`);
    const roleSelectors = blockedWords.map((word) => `[role*=${word} i]`);

    const selectors = tagSelectors
        .concat(classSelectors)
        .concat(idSelectors)
        .concat(roleSelectors);
    const css = `${selectors.join(", ")} { display: none !important; }`;

    createStylesheetText(css, "content-block");
}

const blockedTags = ["footer", "aside", "nav", "gpt-ad"];
const blockedWords = [
    "masthead",
    // "banner",
    "menu",
    // "sidebar",
    "footer",
    "comments",
    "related",
    "recommendation",
    "social",
    "popular",
    // "promo",
    "overlay",
    "login",
    "registration",
    "modal",
    "announcement",
    "cookie",
    "consent",
    "cleanslate",
    "smartfeed",
    "adslot",
    "advert",
];
