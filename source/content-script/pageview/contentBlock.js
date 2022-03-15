import browser from "../../common/polyfill";
import { createStylesheetLink, createStylesheetText } from "./styleChanges";

// hide page elements unrelated to the article via custom CSS, to make a page more readable
// TODO use statically generated CSS
export function insertContentBlockStyle() {
    const classWordSelectors = blockedWords.map(
        (word) => `*:not(html):not(body):not(article)[class*=${word} i]`
    );
    const idSelectors = blockedWords.map((word) => `[id*=${word} i]`);
    const roleSelectors = blockedWords.map((word) => `[role*=${word} i]`);

    const selectors = blockedTags
        .concat(blockedClasses)
        .concat(classWordSelectors)
        .concat(idSelectors)
        .concat(roleSelectors);
    const css = `${selectors.join(", ")} { display: none !important; }`;

    createStylesheetText(css, "content-block");
    createStylesheetLink(
        browser.runtime.getURL("content-script/pageview/manualContentBlock.css")
    );
    // TODO parse config to add page-specific CSS
    if (window.location.href.includes("medium.com")) {
        // they seem to JS CSSOM trickery for the page height
        createStylesheetText(
            "html.pageview > body { overflow-y: visible !important; padding: 0 !important; }",
            "page-specific-fix"
        );
    } else if (window.location.href.includes("substack.com")) {
        createStylesheetText(
            "html.pageview > body { padding: 0 !important; }",
            "page-specific-fix"
        );
    }
}

const blockedTags = ["footer", "aside", "nav", "gpt-ad"];
const blockedWords = [
    "masthead",
    // "banner",
    "menu",
    "nav",
    // "sidebar",
    "footer",
    "comments",
    "related",
    "recommendation",
    "social",
    "popular",
    "promo",
    // "overlay",
    "login",
    "registration",
    "subscribe",
    // "modal",
    "announcement",
    // "cookie",
    "consent",
    "cleanslate",
    "smartfeed",
    "adslot",
    "advert",
];
const blockedClasses = [
    ".ad",
    ".ad-stickyhero",
    ".main-nav",
    ".global-header",
    ".secondary-nav",
    ".email",
    ".movable-ad",
    ".no-ad-layout",
    ".adsbygoogle",
    ".google-auto-placed",
    ".breaker-ad",
    ".pbs__player",
];
