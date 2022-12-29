import { defaultExcludedDomains } from "./defaultStorage";
import { getUserSettingForDomain } from "./storage";
import { getDomainFrom } from "./util";

/*
TODO: the following urls should be enabled but are not:
    https://journals.sagepub.com/doi/10.1177/01461672221079104

    https://words.filippo.io/pay-maintainers/
    https://www.sledgeworx.io/software-leviathans/

TODO: should not be enabled here:
    https://www.nytimes.com/interactive/2022/03/11/nyregion/nyc-chinatown-signs.html
    https://www.theatlantic.com/projects/america-in-person/
*/

// If the extension technically supports this extension
export function extensionSupportsUrl(url) {
    const fileExtension = url.pathname.split(".").pop();
    // Can't easily detect blank html path, so blocklist unsupported instead
    return !["pdf", "png", "gif", "jpg", "jpeg", "webp", "mp3", "mp4", "css", "js"].includes(
        fileExtension
    );
}

// Exclude non-leaf directory pages like bbc.com or bcc.com/news.
// This uses heurstics and won't always be accurate.
export function isNonLeafPage(url) {
    // Very likely not articles
    if (url.pathname === "/") {
        return true;
    }

    /*
    Exclude specific cases where the following checks fail:
        https://alexanderell.is/posts/tuner/
        https://en.wikipedia.org/wiki/Supernatural
        https://ae.studio/blog/victims-of-vimeo
        https://www.atlasobscura.com/articles/what-is-tomato-soup-cake
        https://www.moderndescartes.com/essays/deep_learning_emr/
    */
    if (url.pathname.match(/\/(post|posts|wiki|blog|article|articles|essays|doi|papers)\//)) {
        return false;
    }
    /*
    Specific directory pages
        https://www.newyorker.com/magazine/annals-of-medicine
    */
    if (
        url.pathname.match(/\/(magazine|category|author)\//) &&
        !url.pathname.match(/\/([0-9]+)\//)
    ) {
        return true;
    }

    // Exlude URLs where the following checks fail
    const excludedDomains = [
        "paulgraham.com",
        "sive.rs",
        "fs.blog",
        "danluu.com",
        "xkcd.com",
        "ourworldindata.org",
    ];
    if (excludedDomains.includes(getDomainFrom(url))) {
        return false;
    }

    /*
    Heuristic: articles usually include title in URL:
        https://thoughtspile.github.io/2022/03/21/bad-tech-interview/

    While directory pages do not:
        https://www.theatlantic.com/world/
        https://www.cbsnews.com/ukraine-crisis/
        https://www.axios.com/hard-truths/ 
        https://www.marketwatch.com/personal-finance
        https://www.msn.com/nl-nl/
    */
    const dashCount = url.pathname.match(/\-/g)?.length || 0;
    if (dashCount >= 2) {
        return false;
    }

    return true;
}

export async function isDeniedForDomain(domain) {
    const domainUserSetting = await getUserSettingForDomain(domain);
    return domainUserSetting === "deny" || defaultExcludedDomains.includes(domain);
}

// Determine whether to unclutter a specific web page
// See docs in /docs/article-detection.md
export async function isConfiguredToEnable(domain) {
    // Follow user settings for domain
    const domainUserSetting = await getUserSettingForDomain(domain);
    if (domainUserSetting === "allow") {
        return true;
    }

    return false;
}

export function isArticleByTextContent(): boolean {
    const readingTimeMinutes = document.body.innerText.trim().split(/\s+/).length / 200;
    const linkCount = document.querySelectorAll("a").length;
    const linksPerMinute = linkCount / readingTimeMinutes;
    console.log({ readingTimeMinutes, linkCount, linksPerMinute });

    return readingTimeMinutes >= 4;
}
