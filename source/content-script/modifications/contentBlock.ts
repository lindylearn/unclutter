import browser from "../../common/polyfill";
import {
    createStylesheetLink,
    createStylesheetText,
} from "../../common/stylesheets";
import { lindyMainContainerClass } from "./DOM/textContainer";
import { PageModifier, trackModifierExecution } from "./_interface";

// hide page elements unrelated to the article via custom CSS, to make a page more readable
// TODO use statically generated CSS?
@trackModifierExecution
export default class ContentBlockModifier implements PageModifier {
    private selectors: string[];

    constructor() {
        const wordSelectors = blockedWords
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

// 'shareable' class on <p> on https://www.undrr.org/publication/global-assessment-report-disaster-risk-reduction-2022
const excludeValidElements = `:not(.${lindyMainContainerClass})`;

const blockedTags = ["footer", "aside", "nav", "gpt-ad", "video"];

// words just blocked, but considered if matched text container
export const blockedWords = [
    // ads
    "adslot",
    "advert",
    "adsense", // https://thebarentsobserver.com/en/life-and-public/2022/06/census-results-show-galloping-population-drain-russias-north
    "commercial", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    "empire", // https://www.popsci.com/science/terahertz-waves-future-technologies/
    "google",

    // headers & footers
    "masthead",
    // "headerwrapper", // https://pitchfork.com/news/vangelis-oscar-winning-composer-dies-at-79/
    // "menu", // issues on https://www.sidnlabs.nl/en/news-and-blogs/a-lock-with-many-keys-spoofing-dnssec-signed-domains-in-8-8-8-8
    // "nav",
    "announcement",
    "footer",
    "leaderboard", // https://www.bbc.com/news/uk-england-london-61747092

    // newsletter signups
    "marketing", // https://www.nature.com/articles/s41598-018-38461-y
    "sponsored",
    "signup", // https://www.eff.org/deeplinks/2022/03/campaign-shut-down-crucial-documentary-tool-youtube-dl-continues-and-so-does-fight
    "newslettersignup",
    "login",
    "subscribe",
    "promo", // https://www.cbsnews.com/news/memorial-day-weekend-travel-flight-cancellations/
    "-cta", // https://www.lrb.co.uk/the-paper/v33/n19/daniel-soar/it-knows
    "registration",
    "metered", // https://www.military.com/history/how-naked-skydive-inspired-way-keep-pilots-oriented-flight.html
    "promo",
    "donate", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#research-challenges
    "newsletter", // used by substack
    "contribute", // https://www.themoscowtimes.com/2022/05/25/russian-lawmakers-to-consider-scrapping-upper-age-limit-for-military-service-a77787
    "tease", // https://deadline.com/2022/05/fbi-season-finale-pulled-cbs-1235031812/

    // banners
    "banner", // https://nautil.us/why-people-feel-like-victims-9728/
    "alert",
    "modal", // https://www.fugue.co/blog/2015-11-11-guide-to-emacs.html
    "overlay",
    // "sticky", // https://news.yahoo.com/exclusive-secret-cia-training-program-in-ukraine-helped-kyiv-prepare-for-russian-invasion-090052743.html?guccounter=2
    "aside",
    "popup",
    "callout",
    "aside",
    "message",
    "widget", // https://www.androidcentral.com/phones/nothing-phone-1-design-interview
    "spotlight", // https://www.gamesindustry.biz/articles/2022-05-24-us-labour-board-says-activision-blizzard-illegally-threatened-staff
    "sidebar", // allow e.g. 'with-sidebar' on https://time.com/6176214/proton-ceo-andy-yen-profile/
    "right", // https://en.yna.co.kr/view/AEN20220610002651315

    // related articles
    "related",
    "recommend", // https://reason.com/2022/04/08/the-fbi-decided-not-to-knock-down-a-suspects-front-door-because-it-was-an-affluent-neighborhood/
    "popular",
    "smartfeed",
    "more", // https://www.cleanenergywire.org/news/germany-boosts-renewables-biggest-energy-policy-reform-decades
    "trending", // https://www.tomsguide.com/opinion/google-pixel-6a-might-be-the-most-exciting-phone-of-2022-heres-why
    "featured", // https://edition.cnn.com/2022/05/24/tech/cher-scarlett-facial-recognition-trauma/index.html
    "below", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    "feedback", // https://www.atlasobscura.com/articles/women-hair-wigs-south-korea
    "readnext", // https://blog.gregbrockman.com/its-time-to-become-an-ml-engineer
    "read-next", // https://www.popularmechanics.com/space/moon-mars/a40059188/japan-artemis-partnership/
    "recirc", // https://time.com/6176214/proton-ceo-andy-yen-profile/
    "similar", // https://nautil.us/the-power-of-narrative-15975/
    "next-article", // https://boingboing.net/2022/05/18/expert-on-the-shortcomings-of-mass-transit-in-cyberpunk-2077s-night-city.html
    "latest-posts", // https://www.embedded.com/code-morphing-with-crusoe/
    "js_reading-list", // https://kotaku.com/old-world-is-teaching-strategy-games-some-new-tricks-1842871705
    "links", // https://www.popularmechanics.com/space/moon-mars/a40059188/japan-artemis-partnership/
    "latest", // https://www.science.org/doi/10.1126/science.abk1781?cookieSet=1#latest-news
    "readmore", // fade-out https://news.yahoo.com/us-general-says-elon-musks-210039217.html?guccounter=1

    // cookies
    "cookie",
    "consent",
    "privacy",
    "consent",
    "disclaimer", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity

    // noisy elements
    "social",
    "download", // https://www.globalwitness.org/en/campaigns/digital-threats/ethiopia-hate-speech/
    "disqus", // also may include ads, e.g. https://david-codes.hatanian.com/2019/06/09/aws-costs-every-programmer-should-now.html
    "video",
    "share",
    "composer",
    "comment", // https://slatestarcodex.com/2014/09/30/i-can-tolerate-anything-except-the-outgroup/
];
export const blockedSpecificSelectors = [
    // ads (be careful as 'ad' may appear in other words)
    ".ad",
    ".Ad",
    "[class^='ad-']",
    "[class*=' ad-']",
    "[class$='-ad']",
    "[class*='-ad ']",
    "[class$='-ads']",
    "[class*='-ads ']",
    "[class*='-ad-']",
    ".RTEHashTagLabAdModule",
    "[class*='LDRB']", // https://news.yahoo.com/us-general-says-elon-musks-210039217.html?guccounter=1

    "[class$='-nav' i]", // https://fly.io/blog/a-foolish-consistency/

    // header
    ".global-header",
    ".Page-header",
    ".site-header",
    ".header-main", // https://www.statnews.com/2020/09/24/crows-possess-higher-intelligence-long-thought-primarily-human/
    ".site-header",
    ".penci-header-wrap", // https://londonlovesbusiness.com/russian-sailors-stage-mutiny-and-refuse-to-carry-out-combat-duties-as-they-perceive-each-trip-to-the-sea-as-a-one-way-ticket/
    "#pmc-core-header", // https://deadline.com/2022/05/fbi-season-finale-pulled-cbs-1235031812/
    ".header-placeholder", // https://apnews.com/article/russia-ukraine-janet-yellen-government-and-politics-20dbb506790dddc6f019fa7fdf265514
    "header-cover", // https://kenkantzer.com/learnings-from-5-years-of-tech-startup-code-audits/
    ".byline", // https://www.inkandswitch.com/local-first/
    ".top-bar", // https://www.pathsensitive.com/2022/03/abstraction-not-what-you-think-it-is.html
    ".top-pathing", // https://www.popularmechanics.com/space/moon-mars/a40059188/japan-artemis-partnership/
    "#topbar", // https://blog.samaltman.com/how-to-be-successful
    ".skipToContent", // https://www.fugue.co/blog/2015-11-11-guide-to-emacs.html

    ".email",

    ".pbs__player",
    ".GlobalNav",
    ".navbar", // https://phys.org/news/2022-06-antarctic-glaciers-ice-fastest-years.html

    "[role=complementary]",
    ".hidden-print",
    ".call-to-action", // https://future.a16z.com/the-future-of-search-is-boutique/

    ".link-embed", // https://www.forbes.com/sites/davidphelan/2022/05/24/airpods-pro-2-leak-teases-stunning-innovation-with-a-sting-in-the-tail/?sh=38870a304e88

    ".ntv-moap", // https://time.com/6176214/proton-ceo-andy-yen-profile/
    ".metered-gating-container", // https://www.military.com/history/how-naked-skydive-inspired-way-keep-pilots-oriented-flight.html
    "#gateway-content", // https://www.nytimes.com/2022/05/19/us/princeton-professor-joshua-katz.html
    ".sdc-site-layout-sticky-region", // https://news.sky.com/story/cosmetic-surgery-adverts-targeting-teenagers-banned-12620879
    ".teads-inread", // https://www.cnbc.com/2022/04/05/elon-musk-to-join-twitters-board-of-directors.html
    "#module-moreStories", // https://news.yahoo.com/us-general-says-elon-musks-210039217.html?guccounter=1
    ".caas-readmore-collapse",
];
