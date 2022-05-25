import browser from "../../common/polyfill";
import {
    createStylesheetLink,
    createStylesheetText,
} from "../../common/stylesheets";
import { lindyTextContainerClass } from "./DOM/textContainer";
import { PageModifier, trackModifierExecution } from "./_interface";

// hide page elements unrelated to the article via custom CSS, to make a page more readable
// TODO use statically generated CSS?
@trackModifierExecution
export default class ContentBlockModifier implements PageModifier {
    private selectors: string[];

    constructor() {
        const wordSelectors = blockedWords
            .concat(asideWordBlocklist)
            .flatMap((word) => [
                // block noise by className
                `[class*=${word} i]`,
                `[id*=${word} i]`,
                `[role*=${word} i]`,
                // fixed inline styles
                `[style*='fixed']`,
                `[style*='sticky']`,
            ])
            .map((selector) => `${excludeValidElements}${selector}`);

        this.selectors = blockedTags
            .concat(blockedSpecificSelectors)
            .concat(wordSelectors);
    }

    fadeOutNoise() {
        document.getElementById("content-block-fadein")?.remove();
        if (document.getElementById("content-block-fadeout")) {
            return;
        }

        const css = `${this.selectors.join(
            ", "
        )} { visibility: hidden !important; opacity: 0 !important; transition: all 0.3s linear; background-color: #d1d5db !important; }`;
        // TODO animate to 0 area? height: 0; width: 0; overflow: hidden;

        createStylesheetText(css, "content-block-fadeout");
    }

    // need to actually remove in pageview (may override responsive style)
    transitionIn() {
        // completely hide blocked elements to reduce their render cost
        // e.g. this improves performance significantly on https://sherylcanter.com/wordpress/2010/01/a-science-based-technique-for-seasoning-cast-iron/
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

    async fadeInNoise() {
        const css = `${this.selectors.join(
            ", "
        )} { visibility: visible !important; opacity: 1 !important; transition: all 0.3s linear; }`;
        // TODO animate to 0 area? height: 0; width: 0; overflow: hidden;

        createStylesheetText(css, "content-block-fadein");

        document.getElementById("content-block-fadeout")?.remove();
    }

    async transitionOut() {
        document
            .querySelectorAll(
                ".content-block-hide, .content-block-custom-sites"
            )
            .forEach((e) => e.remove());
    }
}

const excludeValidElements = `*:not(html):not(body):not(article):not(.${lindyTextContainerClass})`;

const blockedTags = [
    "footer",
    "aside",
    "nav",
    "gpt-ad",
    "iframe:not(.lindy-allowed-iframe)",
];
// match aside containers to block
// be careful here
export const asideWordBlocklist = [
    "footer",
    "aside",
    "banner",
    // "alert", // https://www.cnbc.com/2022/05/23/new-york-city-removes-the-last-payphone-from-service.html
    "message",
    "nav",
    "menu",
    "privacy",
    "consent",
    "cookies",
    // "widget", https://www.androidcentral.com/phones/nothing-phone-1-design-interview
    "popup",
    "caption",
    "gallery",
    // "newsletter", // used by substack
    "promo",
    "composer",
    "callout",
    "related", // https://blog.google/threat-analysis-group/protecting-android-users-from-0-day-attacks/
    "comment", // https://slatestarcodex.com/2014/09/30/i-can-tolerate-anything-except-the-outgroup/
    "signup", // https://www.theverge.com/2022/5/24/23137797/logitech-mx-master-3s-mechanical-mini-mouse-keyboard-price-release-date-features
    "masthead",
    "below", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    "cta", // https://www.lrb.co.uk/the-paper/v33/n19/daniel-soar/it-knows
    // "sticky", // https://news.yahoo.com/exclusive-secret-cia-training-program-in-ukraine-helped-kyiv-prepare-for-russian-invasion-090052743.html?guccounter=2
    // "share", 'no-share' https://www.whichev.net/2022/03/29/theion-sulphur-crystal-batteries-promise-breakthrough-in-energy-density/
    "share-icons", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#research-challenges
    "share-bar", // https://www.buzzfeednews.com/article/richardnieva/worldcoin-crypto-eyeball-scanning-orb-problems
    "donate", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#research-challenges
    "recommended", // https://reason.com/2022/04/08/the-fbi-decided-not-to-knock-down-a-suspects-front-door-because-it-was-an-affluent-neighborhood/
    "readnext", // https://blog.gregbrockman.com/its-time-to-become-an-ml-engineer
    "watch-next", // https://www.popularmechanics.com/space/moon-mars/a40059188/japan-artemis-partnership/
    "recirc", // https://time.com/6176214/proton-ceo-andy-yen-profile/
    "similar", // https://nautil.us/the-power-of-narrative-15975/
    "next-article", // https://boingboing.net/2022/05/18/expert-on-the-shortcomings-of-mass-transit-in-cyberpunk-2077s-night-city.html
    "below", // https://www.thecity.nyc/2022/2/24/22949795/new-york-rolling-out-noise-law-listening-tech-for-souped-up-speedsters
    "latest-posts", // https://www.embedded.com/code-morphing-with-crusoe/
    "carousel", // https://psyche.co/films/a-gym-built-of-soviet-era-scraps-is-a-creative-community-hub
    "js_reading-list", // https://kotaku.com/old-world-is-teaching-strategy-games-some-new-tricks-1842871705
    "trending", // https://www.tomsguide.com/opinion/google-pixel-6a-might-be-the-most-exciting-phone-of-2022-heres-why
    "featured", // https://edition.cnn.com/2022/05/24/tech/cher-scarlett-facial-recognition-trauma/index.html
    "tease", // https://deadline.com/2022/05/fbi-season-finale-pulled-cbs-1235031812/
];

// words just blocked, but considered if matched text container
export const blockedWords = [
    "gpt-ad", // https://www.embedded.com/code-morphing-with-crusoe/
    "-ad", // https://kotaku.com/old-world-is-teaching-strategy-games-some-new-tricks-1842871705
    "commercial", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    "masthead",
    // "banner",
    "marketing", // https://www.nature.com/articles/s41598-018-38461-y
    // "headerwrapper", // https://pitchfork.com/news/vangelis-oscar-winning-composer-dies-at-79/
    "menu", // issues on https://www.sidnlabs.nl/en/news-and-blogs/a-lock-with-many-keys-spoofing-dnssec-signed-domains-in-8-8-8-8
    // "aside", https://www.sec.gov/news/press-release/2022-55
    // "nav",
    "footer",
    "comment",
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
    "metered", // https://www.military.com/history/how-naked-skydive-inspired-way-keep-pilots-oriented-flight.html
    "smartfeed",
    "adslot",
    "advert",
    "video",
    "signup", // https://www.eff.org/deeplinks/2022/03/campaign-shut-down-crucial-documentary-tool-youtube-dl-continues-and-so-does-fight
    "newslettersignup",
    "more", // https://www.cleanenergywire.org/news/germany-boosts-renewables-biggest-energy-policy-reform-decades
];
export const blockedSpecificSelectors = [
    ".ad",
    ".Ad", // https://www.buzzfeednews.com/article/richardnieva/worldcoin-crypto-eyeball-scanning-orb-problems
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
    "*:not(body).sidebar", // allow e.g. 'with-sidebar' on https://time.com/6176214/proton-ceo-andy-yen-profile/
    "#sidebar", // https://www.overcomingbias.com/2008/02/my-favorite-lia.html
    ".page__sidebar", // https://www.military.com/history/how-naked-skydive-inspired-way-keep-pilots-oriented-flight.html
    ".ntv-moap", // https://time.com/6176214/proton-ceo-andy-yen-profile/
    ".primis-ad-wrap", // https://appleinsider.com/articles/22/04/06/iphone-airpods-apple-watch-all-dominate-the-teen-technology-market
    ".leadinModal", // https://www.fugue.co/blog/2015-11-11-guide-to-emacs.html
    ".metered-gating-container", // https://www.military.com/history/how-naked-skydive-inspired-way-keep-pilots-oriented-flight.html
    "#gateway-content", // https://www.nytimes.com/2022/05/19/us/princeton-professor-joshua-katz.html
    "#topbar", // https://blog.samaltman.com/how-to-be-successful
    ".site-header",
    ".link-embed", // https://www.forbes.com/sites/davidphelan/2022/05/24/airpods-pro-2-leak-teases-stunning-innovation-with-a-sting-in-the-tail/?sh=38870a304e88
    ".disclaimer", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    ".top-pathing", // https://www.popularmechanics.com/space/moon-mars/a40059188/japan-artemis-partnership/
    ".embed-editorial-links", // https://www.popularmechanics.com/space/moon-mars/a40059188/japan-artemis-partnership/
    ".FITT_Article_TwoColumnSidebar", // https://abcnews.go.com/US/victims-parents-oxford-school-shooting-victims-sue-school/story?id=84933834
    ".penci-header-wrap", // https://londonlovesbusiness.com/russian-sailors-stage-mutiny-and-refuse-to-carry-out-combat-duties-as-they-perceive-each-trip-to-the-sea-as-a-one-way-ticket/
    "#pmc-core-header", // https://deadline.com/2022/05/fbi-season-finale-pulled-cbs-1235031812/
];
