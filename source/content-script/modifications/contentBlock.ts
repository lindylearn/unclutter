import browser from "../../common/polyfill";
import {
    createStylesheetLink,
    createStylesheetText,
} from "../../common/stylesheets";
import { PageModifier, trackModifierExecution } from "./_interface";

// hide page elements unrelated to the article via custom CSS, to make a page more readable
// TODO use statically generated CSS?
@trackModifierExecution
export default class ContentBlockModifier implements PageModifier {
    private selectors: string[];
    constructor() {
        const classWordSelectors = blockedWords.map(
            (word) =>
                `*:not(html):not(body):not(article):not(.lindy-text-container)[class*=${word} i]`
        );
        const idSelectors = blockedWords.map((word) => `[id*=${word} i]`);
        const roleSelectors = blockedWords.map((word) => `[role*=${word} i]`);

        this.selectors = blockedTags
            .concat(blockedClasses)
            .concat(classWordSelectors)
            .concat(idSelectors)
            .concat(roleSelectors);
    }

    fadeOutNoise() {
        document.getElementById("content-block-fadein")?.remove();
        if (document.getElementById("content-block-fadeout")) {
            return;
        }

        const css = `${this.selectors.join(
            ", "
        )} { visibility: hidden !important; opacity: 0 !important; transition: visibility 0.2s, opacity 0.2s linear; }`;
        // TODO animate to 0 area? height: 0; width: 0; overflow: hidden;

        createStylesheetText(css, "content-block-fadeout");
    }

    async fadeInNoise() {
        const css = `${this.selectors.join(
            ", "
        )} { visibility: visible !important; opacity: 1 !important; transition: visibility 0.2s, opacity 0.2s linear; }`;
        // TODO animate to 0 area? height: 0; width: 0; overflow: hidden;

        createStylesheetText(css, "content-block-fadein");

        document.getElementById("content-block-fadeout")?.remove();
    }

    // need to actually remove in pageview (may override responsive style)
    transitionIn() {
        const css = `${this.selectors.join(
            ", "
        )} { display: none !important; }`;
        createStylesheetText(css, "content-block-hide");

        createStylesheetLink(
            browser.runtime.getURL(
                "content-script/pageview/manualContentBlock.css"
            ),
            "content-block-custom-sites"
        );
    }

    async transitionOut() {
        document
            .querySelectorAll(
                ".content-block-hide, .content-block-custom-sites"
            )
            .forEach((e) => e.remove());
    }
}

const blockedTags = ["footer", "aside", "nav", "gpt-ad"];
export const blockedWords = [
    "masthead",
    // "banner",
    // "headerwrapper", // https://pitchfork.com/news/vangelis-oscar-winning-composer-dies-at-79/
    "menu",
    // "aside", https://www.sec.gov/news/press-release/2022-55
    // "nav",
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
    "cta", // https://www.lrb.co.uk/the-paper/v33/n19/daniel-soar/it-knows
    // "sticky", // https://news.yahoo.com/exclusive-secret-cia-training-program-in-ukraine-helped-kyiv-prepare-for-russian-invasion-090052743.html?guccounter=2
    // "share", 'no-share' https://www.whichev.net/2022/03/29/theion-sulphur-crystal-batteries-promise-breakthrough-in-energy-density/
    "share-icons", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#research-challenges
    "more", // https://www.cleanenergywire.org/news/germany-boosts-renewables-biggest-energy-policy-reform-decades
    "donate", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#research-challenges
    "recommended", // https://reason.com/2022/04/08/the-fbi-decided-not-to-knock-down-a-suspects-front-door-because-it-was-an-affluent-neighborhood/
    "readnext", // https://blog.gregbrockman.com/its-time-to-become-an-ml-engineer
    "recirc", // https://time.com/6176214/proton-ceo-andy-yen-profile/
    "similar", // https://nautil.us/the-power-of-narrative-15975/
    "next-article", // https://boingboing.net/2022/05/18/expert-on-the-shortcomings-of-mass-transit-in-cyberpunk-2077s-night-city.html
    "thumbnail", // https://psyche.co/guides/how-to-have-a-life-full-of-wonder-and-learning-about-the-world
    "below", // https://www.thecity.nyc/2022/2/24/22949795/new-york-rolling-out-noise-law-listening-tech-for-souped-up-speedsters
];
export const blockedClasses = [
    ".ad",
    ".ad-stickyhero",
    ".RTEHashTagLabAdModule",
    ".main-nav",
    ".global-header",
    ".Page-header",
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
    ".header-main", // https://www.statnews.com/2020/09/24/crows-possess-higher-intelligence-long-thought-primarily-human/
    ".top-bar", // https://www.pathsensitive.com/2022/03/abstraction-not-what-you-think-it-is.html
    "[role=complementary]",
    ".hidden-print",
    "#related-articles",
    ".c-recirc-module", // https://www.theverge.com/23017107/crypto-billion-dollar-bridge-hack-decentralized-finance
    "#latest-news", // https://www.science.org/doi/10.1126/science.abk1781?cookieSet=1#latest-news
    ".call-to-action", // https://future.a16z.com/the-future-of-search-is-boutique/
    ".sidebar", // allow e.g. 'with-sidebar' on https://time.com/6176214/proton-ceo-andy-yen-profile/
    ".ntv-moap", // https://time.com/6176214/proton-ceo-andy-yen-profile/
];
