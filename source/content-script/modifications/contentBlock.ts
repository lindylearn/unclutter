import browser from "../../common/polyfill";
import {
    createStylesheetLink,
    createStylesheetText,
} from "../../common/stylesheets";
import { lindyContainerClass } from "./DOM/textContainer";
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
        )} { visibility: hidden !important; opacity: 0 !important; transition: opacity 0.3s linear, visibility 0.3s linear; }`;
        // background-color: #e5e7eb !important;

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

    fadeInNoise() {
        const css = `${this.selectors.join(
            ", "
        )} { visibility: visible !important; opacity: 1 !important; transition: all 0.3s linear; }`;
        createStylesheetText(css, "content-block-fadein");

        document.getElementById("content-block-fadeout")?.remove();
    }

    transitionOut() {
        document
            .querySelectorAll(
                ".content-block-hide, .content-block-custom-sites"
            )
            .forEach((e) => e.remove());
    }
}

const excludeValidElements = `*:not(html):not(body):not(article):not(.${lindyContainerClass})`;

const blockedTags = [
    "footer",
    "aside",
    "nav",
    "gpt-ad",
    // "iframe:not(.lindy-allowed-iframe)",
];
// match aside containers to block
// be careful here
export const asideWordBlocklist = [
    // "footer", https://www.undrr.org/publication/global-assessment-report-disaster-risk-reduction-2022
    "aside",
    // "alert", // https://www.cnbc.com/2022/05/23/new-york-city-removes-the-last-payphone-from-service.html
    "message",
    // "-nav", // https://fly.io/blog/a-foolish-consistency/
    "menu",
    "privacy",
    "consent",
    "cookies",
    // "widget", https://www.androidcentral.com/phones/nothing-phone-1-design-interview
    "popup",
    "caption",
    "gallery",
    // "newsletter", // used by substack
    "composer",
    "callout",
    "related", // https://blog.google/threat-analysis-group/protecting-android-users-from-0-day-attacks/
    "signup", // https://www.theverge.com/2022/5/24/23137797/logitech-mx-master-3s-mechanical-mini-mouse-keyboard-price-release-date-features
    "masthead",
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
    "latest-posts", // https://www.embedded.com/code-morphing-with-crusoe/
    "carousel", // https://psyche.co/films/a-gym-built-of-soviet-era-scraps-is-a-creative-community-hub
    "js_reading-list", // https://kotaku.com/old-world-is-teaching-strategy-games-some-new-tricks-1842871705
    "tease", // https://deadline.com/2022/05/fbi-season-finale-pulled-cbs-1235031812/
    "tooltip", // https://www.businessinsider.com/soros-urges-europe-heavy-taxes-on-russian-natural-gas-putin-2022-5?international=true&r=US&IR=T
    "contribute", // https://www.themoscowtimes.com/2022/05/25/russian-lawmakers-to-consider-scrapping-upper-age-limit-for-military-service-a77787
    "comment", // https://slatestarcodex.com/2014/09/30/i-can-tolerate-anything-except-the-outgroup/
    "spotlight", // https://www.gamesindustry.biz/articles/2022-05-24-us-labour-board-says-activision-blizzard-illegally-threatened-staff
];

// words just blocked, but considered if matched text container
export const blockedWords = [
    "gpt-ad", // https://www.embedded.com/code-morphing-with-crusoe/
    "-ad", // https://kotaku.com/old-world-is-teaching-strategy-games-some-new-tricks-1842871705
    "commercial", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    "empire", // https://www.popsci.com/science/terahertz-waves-future-technologies/
    "masthead",
    // "banner",
    "marketing", // https://www.nature.com/articles/s41598-018-38461-y
    // "headerwrapper", // https://pitchfork.com/news/vangelis-oscar-winning-composer-dies-at-79/
    "menu", // issues on https://www.sidnlabs.nl/en/news-and-blogs/a-lock-with-many-keys-spoofing-dnssec-signed-domains-in-8-8-8-8
    // "aside", https://www.sec.gov/news/press-release/2022-55
    // "nav",
    "footer",
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
    // "sticky", // https://news.yahoo.com/exclusive-secret-cia-training-program-in-ukraine-helped-kyiv-prepare-for-russian-invasion-090052743.html?guccounter=2
    "banner", // https://nautil.us/why-people-feel-like-victims-9728/
    "trending", // https://www.tomsguide.com/opinion/google-pixel-6a-might-be-the-most-exciting-phone-of-2022-heres-why
    "featured", // https://edition.cnn.com/2022/05/24/tech/cher-scarlett-facial-recognition-trauma/index.html
    "-cta", // https://www.lrb.co.uk/the-paper/v33/n19/daniel-soar/it-knows
    "hidden", // https://www.atlasobscura.com/articles/women-hair-wigs-south-korea
    "feedback", // https://www.atlasobscura.com/articles/women-hair-wigs-south-korea
    "below", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    "promo", // https://www.cbsnews.com/news/memorial-day-weekend-travel-flight-cancellations/
];
export const blockedSpecificSelectors = [
    ".ad",
    ".Ad", // https://www.buzzfeednews.com/article/richardnieva/worldcoin-crypto-eyeball-scanning-orb-problems
    ".ad-wrapper", // https://www.smithsonianmag.com/science-nature/why-have-female-animals-evolved-such-wild-genitals-180979813/
    ".ad-slot", // https://www.smithsonianmag.com/science-nature/why-have-female-animals-evolved-such-wild-genitals-180979813/
    ".ad-container", // https://www.zeit.de/sport/2018-03/doping-east-germany-research-harald-freyberger-english/komplettansicht
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
    ".header-placeholder", // https://apnews.com/article/russia-ukraine-janet-yellen-government-and-politics-20dbb506790dddc6f019fa7fdf265514
    ".sdc-site-layout-sticky-region", // https://news.sky.com/story/cosmetic-surgery-adverts-targeting-teenagers-banned-12620879
    ".skipToContent", // https://www.fugue.co/blog/2015-11-11-guide-to-emacs.html
    "header-cover", // https://kenkantzer.com/learnings-from-5-years-of-tech-startup-code-audits/
    ".teads-inread", // https://www.cnbc.com/2022/04/05/elon-musk-to-join-twitters-board-of-directors.html
    ".byline", // https://www.inkandswitch.com/local-first/
];
