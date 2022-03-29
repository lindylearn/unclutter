import browser from "../../common/polyfill";
import {
    createStylesheetLink,
    createStylesheetText,
} from "../style-changes/common";

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

    function fadeOut() {
        const css = `${selectors.join(
            ", "
        )} { visibility: hidden !important; opacity: 0 !important; transition: visibility 0.2s, opacity 0.2s linear; }`;
        // TODO animate to 0 area? height: 0; width: 0; overflow: hidden;

        createStylesheetText(css, "content-block");
    }

    // need to actually remove in pageview (may override responsive style)
    function remove() {
        const css = `${selectors.join(", ")} { display: none !important; }`;
        createStylesheetText(css, "content-block");

        createStylesheetLink(
            browser.runtime.getURL(
                "content-script/pageview/manualContentBlock.css"
            )
        );
    }

    return [fadeOut, remove];
}

const blockedTags = ["footer", "aside", "nav", "gpt-ad"];
const blockedWords = [
    "masthead",
    // "banner",
    "menu",
    "aside",
    // "nav",
    // "sidebar",
    "footer",
    "comments",
    "related",
    "recommendation",
    "social",
    "popular",
    // "promo",
    "sponsored",
    // "overlay",
    "login",
    "registration",
    "subscribe",
    // "modal",
    "announcement",
    "alert",
    // "cookie",
    "consent",
    "cleanslate",
    "smartfeed",
    "adslot",
    "advert",
    "video",
    "newslettersignup",
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
    ".dotcom-ad",
    ".subnav-ad-layout",
    "#marquee-ad",
    ".ad-unit",
    ".GlobalNav",
    "#bannerandheader",
    ".site-header",
    "#site_banner",
];
