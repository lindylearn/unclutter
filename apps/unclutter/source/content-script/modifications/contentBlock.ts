import browser from "../../common/polyfill";
import { createStylesheetLink, createStylesheetText } from "../../common/stylesheets";
import domainBlocklistSelectors from "../../data/domainBlocklistSelectors.json";
import TextContainerModifier, {
    lindyContainerClass,
    lindyImageContainerClass,
    lindyMainContentContainerClass,
    lindyMainHeaderContainerClass,
} from "./DOM/textContainer";
import { PageModifier, trackModifierExecution } from "./_interface";

// hide page elements unrelated to the article via custom CSS, to make a page more readable
// TODO use statically generated CSS?
@trackModifierExecution
export default class ContentBlockModifier implements PageModifier {
    private domain: string;
    private selectors: string[];

    private textContainerModifier: TextContainerModifier;

    constructor(domain: string, textContainerModifier: TextContainerModifier) {
        this.domain = domain;
        this.textContainerModifier = textContainerModifier;
    }

    prepare() {
        // apply no word-based blocking if no DOM elements found
        if (
            !this.textContainerModifier.foundMainContentElement &&
            !this.textContainerModifier.foundMainHeadingElement
        ) {
            this.selectors = blockedTags.concat(domainBlocklistSelectors[this.domain] || []);
            return;
        }

        const excludedSelectors = [
            `.${lindyImageContainerClass}`,
            `.lindy-allowed-iframe`,
            `svg`, // <svg> e.g. on https://garymarcus.substack.com/p/what-does-it-mean-when-an-ai-fails?s=r
            `[data-observe-resizes]`, // https://edition.cnn.com/2022/09/22/europe/russia-mobilization-logistics-analysis-intl-hnk-ml/index.html
        ];

        // be less strict if no main text or header found respectively
        if (this.textContainerModifier.foundMainContentElement) {
            excludedSelectors.push(`.${lindyMainContentContainerClass}`);
        } else {
            excludedSelectors.push(`.${lindyContainerClass}`);
        }
        if (this.textContainerModifier.foundMainHeadingElement) {
            excludedSelectors.push(`.${lindyMainHeaderContainerClass}`);
        } else {
            // excludedSelectors.push(`.${lindyHeadingContainerClass}`);
        }

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
            .concat(blockedSpecificSelectors)
            .map((selector) => `${selector}:not(${excludedSelectors.join(", ")})`);

        this.selectors = blockedTags
            .concat(wordSelectors)
            .concat(domainBlocklistSelectors[this.domain] || []);
    }

    // need to actually remove in pageview (may override responsive style)
    transitionIn() {
        // completely hide blocked elements to reduce their render cost
        // e.g. this improves performance significantly on https://sherylcanter.com/wordpress/2010/01/a-science-based-technique-for-seasoning-cast-iron/
        const css = `${this.selectors.join(", ")} { display: none !important; }`;
        createStylesheetText(css, "content-block-hide");

        createStylesheetLink(
            browser.runtime.getURL("data/manualContentBlock.css"),
            "content-block-custom-sites"
        );
    }

    fadeInNoise() {
        const css = `
        ${this.selectors.join(", ")} {
            animation-duration: 0.3s;
            animation-name: fadeInFromNone;
        }
        @keyframes fadeInFromNone {
            0% {
                opacity: 0;
            }
            1% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
        }
        `;
        createStylesheetText(css, "content-block-fade-in");

        document
            .querySelectorAll("#content-block-hide, #content-block-custom-sites")
            .forEach((e) => e.remove());
    }

    transitionOut() {
        document
            .querySelectorAll(
                "#content-block-hide, #content-block-custom-sites, #content-block-fade-in"
            )
            .forEach((e) => e.remove());
    }
}

const blockedTags = ["footer", "aside", "nav", "gpt-ad"];

// words just blocked, but considered if matched text container
export const blockedWords = [
    // ads
    "adslot",
    "advert",
    "adsense", // https://thebarentsobserver.com/en/life-and-public/2022/06/census-results-show-galloping-population-drain-russias-north
    "commercial", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity
    "empire", // https://www.popsci.com/science/terahertz-waves-future-technologies/
    "google",
    "dianomi", // https://www.wsj.com/articles/google-doc-sharing-work-collaboration-11654612774

    // headers & footers
    "masthead",
    // "headerwrapper", // https://pitchfork.com/news/vangelis-oscar-winning-composer-dies-at-79/
    "menu",
    "nav", // https://hothardware.com/news/how-flesh-penetrating-sound-waves-could-3d-print-implants
    "announcement",
    "footer",
    "leaderboard", // https://www.bbc.com/news/uk-england-london-61747092
    "topbar", // https://annehelen.substack.com/p/is-everything-an-mlm?s=r
    "breadcrumb", // https://www.mei.edu/blog/monday-briefing-under-brutal-pressure-israels-coalition-verge-crumbling

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
    "support", // https://scroll.in/article/1024765/when-jawaharlal-nehru-read-lolita-to-decide-whether-an-obscene-book-should-be-allowed-in-india
    "tease", // https://deadline.com/2022/05/fbi-season-finale-pulled-cbs-1235031812/
    "account", // https://www.zigpoll.com/blog/being-a-solopreneur-part-one
    "member", // https://spectrum.ieee.org/commodore-64
    "subscription", // https://dx.tips/the-end-of-localhost
    "plea", // https://fortune.com/2022/06/12/if-you-thought-the-tech-rout-was-bad-spare-a-dime-for-retailers/
    "onesignal", // https://www.tomsguide.com/face-off/macbook-air-vs-macbook-pro

    // banners
    "banner", // https://nautil.us/why-people-feel-like-victims-9728/
    "alert",
    "modal", // https://www.fugue.co/blog/2015-11-11-guide-to-emacs.html
    "prompt", // https://edition.cnn.com/cnn-underscored/reviews/best-rain-jackets?iid=CNNUnderscoredHPcontainer
    "overlay",
    // "sticky", // https://news.yahoo.com/exclusive-secret-cia-training-program-in-ukraine-helped-kyiv-prepare-for-russian-invasion-090052743.html?guccounter=2
    "aside",
    "popup",
    "callout",
    "aside",
    "message",
    "spotlight", // https://www.gamesindustry.biz/articles/2022-05-24-us-labour-board-says-activision-blizzard-illegally-threatened-staff
    "sidebar", // allow e.g. 'with-sidebar' on https://time.com/6176214/proton-ceo-andy-yen-profile/
    "floating", // https://www.zdnet.com/article/opera-brave-vivaldi-to-ignore-chromes-anti-ad-blocker-changes-despite-shared-codebase/
    "breaking", // https://www.cbsnews.com/boston/news/simone-biles-aly-raisman-gymnasts-larry-nassar-fbi-lawsuit/
    "recent", // https://thehustle.co/06062022-social-audio/
    "notification", // https://garymarcus.substack.com/p/nonsense-on-stilts?s=r
    "ticker", // https://edition.cnn.com/2022/06/19/energy/germany-russia-gas-supplies-winter-intl/index.html
    "ribbon", // https://edition.cnn.com/2022/06/19/energy/germany-russia-gas-supplies-winter-intl/index.html
    // "widget", // https://www.hope-rehab-center-thailand.com/blog/personal-development/how-selfishness-ruins-everything-but-kindness-heals/
    "backdrop", // https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit

    // related articles
    "related",
    "recommend", // https://reason.com/2022/04/08/the-fbi-decided-not-to-knock-down-a-suspects-front-door-because-it-was-an-affluent-neighborhood/
    "popular",
    "smartfeed",
    // "more", // issue on http://www.antipope.org/charlie/blog-static/2013/12/why-i-want-bitcoin-to-die-in-a.html
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
    "feed", // https://9to5mac.com/2022/06/08/qualcomm-will-beat-m2/
    "mostRead", // https://english.alarabiya.net/News/world/2022/06/09/Berlin-driver-s-confused-statements-under-investigation
    "favorites", // https://fortune.com/2022/06/12/if-you-thought-the-tech-rout-was-bad-spare-a-dime-for-retailers/
    "social-icon", // https://devblogs.microsoft.com/oldnewthing/20220608-00/?p=106727

    // cookies
    "cookie",
    "consent",
    "privacy",
    "consent",
    "disclaimer", // https://www.rockpapershotgun.com/the-lord-of-the-rings-gollum-preview-may-miss-a-precious-opportunity

    // noisy elements
    "follow", // https://english.alarabiya.net/News/world/2022/06/09/Berlin-driver-s-confused-statements-under-investigation
    "download", // https://www.globalwitness.org/en/campaigns/digital-threats/ethiopia-hate-speech/
    "disqus", // also may include ads, e.g. https://david-codes.hatanian.com/2019/06/09/aws-costs-every-programmer-should-now.html
    // "share", // blocks images e.g. on https://spectrum.ieee.org/commodore-64
    "-share-", // https://www.bbc.com/worklife/article/20220525-how-self-deception-allows-people-to-lie
    "share-icons", // https://asia.nikkei.com/Business/Business-trends/Japan-to-fine-Meta-Twitter-if-they-keep-neglecting-domestic-registry
    "share-section", // https://brighterworld.mcmaster.ca/articles/going-all-the-way-scientists-prove-inhaled-vaccines-offer-better-protection-than-nasal-sprays/
    "sharing", // https://theaviationgeekclub.com/sr-71-pilot-explains-how-he-survived-to-his-blackbird-disintegration-at-a-speed-of-mach-3-2/
    "composer",
    "comment", // https://slatestarcodex.com/2014/09/30/i-can-tolerate-anything-except-the-outgroup/
    "print", // catch all .hidden-print and .print-remove ?
    "skip", // https://www.fugue.co/blog/2015-11-11-guide-to-emacs.html
    "extra", // https://arxiv.org/abs/2206.02871
    "contacts", // https://www.europarl.europa.eu/news/en/press-room/20220613IPR32838/eu-covid-certificate-meps-and-council-agree-to-extend-rules-for-another-year
    "home", // https://blog.cryptographyengineering.com/2022/06/09/in-defense-of-cryptocurrency/
    "playlist", // https://edition.cnn.com/2022/09/22/europe/russia-mobilization-logistics-analysis-intl-hnk-ml/index.html
    "search", // https://blog.thunderbird.net/2022/06/thunderbird-102-released-a-serious-upgrade-to-your-communication/
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
    "[id^='ad-']",
    "[id*=' ad-']",
    "[id$='-ad']",
    "[id*='-ad ']",
    "[id$='-ads']",
    "[id*='-ads ']",
    "[id*='-ad-']",
    ".apexAd", // https://www.axios.com/2022/06/18/black-hole-milky-way-hubble-space-telescope
    ".RTEHashTagLabAdModule",
    ".adplaceholder",
    ".c-adDisplay_container", // https://www.zdnet.com/article/opera-brave-vivaldi-to-ignore-chromes-anti-ad-blocker-changes-despite-shared-codebase/
    "[class*='LDRB']", // https://news.yahoo.com/us-general-says-elon-musks-210039217.html?guccounter=1
    "[data-google-query-id]", // https://www.romania-insider.com/unidentified-plane-ro-airspace-jun-2022
    "#ad_before_header",
    ".billboard-container", // https://www.dailymail.co.uk/tvshowbiz/article-10913383/Hugh-Jackman-tests-positive-COVID-19-just-one-day-Tony-Awards.html

    "[class$='-nav' i]", // https://fly.io/blog/a-foolish-consistency/

    // header
    `header:not(.${lindyMainHeaderContainerClass})`, // https://www.abc.net.au/news/2022-06-14/xi-jinping-expands-china-military-influence-abroad/101152154
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
    ".header__bars", // https://torrentfreak.com/iptv-pirate-must-pay-963k-or-88-month-prison-sentence-becomes-168-220607/
    ".blog-header", // https://dx.tips/the-end-of-localhost
    "#headerArea", // https://blogs.microsoft.com/on-the-issues/2022/06/08/microsoft-announces-four-new-employee-workforce-initiatives/
    ".page-header", // https://www.dailymail.co.uk/tvshowbiz/article-10913383/Hugh-Jackman-tests-positive-COVID-19-just-one-day-Tony-Awards.html
    ".post-info", // https://theantistartup.com/i-stopped-advertising-everywhere-and-nothing-happened/
    "#topMetaLang", // https://www.dw.com/en/germany-takes-first-step-towards-relaxing-cannabis-law/a-62120448
    ".sr-only", // https://arxiv.org/abs/2206.02871
    ".header-link", // https://lazywinadmin.com/2013/10/powershell-using-adsi-with-alternate.html

    ".Post-header-grid", // https://theintercept.com/2022/06/13/progressive-organizing-infighting-callout-culture/

    ".email",

    ".pbs__player",
    ".GlobalNav",
    ".navbar", // https://phys.org/news/2022-06-antarctic-glaciers-ice-fastest-years.html

    "[role=complementary]",
    ".call-to-action", // https://future.a16z.com/the-future-of-search-is-boutique/

    ".link-embed", // https://www.forbes.com/sites/davidphelan/2022/05/24/airpods-pro-2-leak-teases-stunning-innovation-with-a-sting-in-the-tail/?sh=38870a304e88

    ".ntv-moap", // https://time.com/6176214/proton-ceo-andy-yen-profile/
    ".metered-gating-container", // https://www.military.com/history/how-naked-skydive-inspired-way-keep-pilots-oriented-flight.html
    "#gateway-content", // https://www.nytimes.com/2022/05/19/us/princeton-professor-joshua-katz.html
    ".sdc-site-layout-sticky-region", // https://news.sky.com/story/cosmetic-surgery-adverts-targeting-teenagers-banned-12620879
    ".teads-inread", // https://www.cnbc.com/2022/04/05/elon-musk-to-join-twitters-board-of-directors.html
    "#module-moreStories", // https://news.yahoo.com/us-general-says-elon-musks-210039217.html?guccounter=1
    ".c-shortcodePinbox", // https://www.zdnet.com/article/opera-brave-vivaldi-to-ignore-chromes-anti-ad-blocker-changes-despite-shared-codebase/
    "[aria-label=Latest]", // https://yle.fi/news/3-12484032
    "#sSS_Feature_Post_0_0_21_0_0_1_5_2", // https://spectrum.ieee.org/commodore-64
    ".wafer-rapid-module", // https://news.yahoo.com/thailand-legalizes-growing-consumption-marijuana-135808124.html
    ".sdc-article-author", // https://news.sky.com/story/russia-made-79-4bn-in-first-100-days-of-ukraine-war-by-selling-oil-and-gas-to-the-world-12632810
    "#news_ticker", // https://www.sentinelassam.com/international/serbia-germany-disagree-over-imposing-sanctions-on-russia-596536
    ".social", // https://thehill.com/news/administration/3522080-trump-releases-12-page-response-to-jan-6-hearing/
    ".PostSocial", // https://theintercept.com/2022/06/14/amazon-ring-camera-police-privacy-ed-markey/
    ".share-module", // https://pitchfork.com/features/article/10055-how-to-buy-the-best-home-recording-studio-equipment-a-beginners-guide/
    ".highwire-cite-authors", // https://www.biorxiv.org/content/10.1101/2022.05.15.491973v1
    "#_fbn_", // https://www.geeksforgeeks.org/fasttext-working-and-implementation/
    ".lightbox-target", // https://www.geeksforgeeks.org/fasttext-working-and-implementation/

    // term of contents (Unclutter shows its own outline)
    ".toc",
    "#toc",
];
