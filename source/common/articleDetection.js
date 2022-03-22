import { defaultExcludedDomains } from "./defaultStorage";
import {
    automaticallyEnabledFeatureFlag,
    getFeatureFlag,
} from "./featureFlags";
import { getUserSettingForDomain } from "./storage";
import { getDomainFrom } from "./util";

// Determine whether to unclutter a specific web page
// See docs in /docs/article-detection.md
export default async function shouldEnableOnURL(urlText) {
    const url = new URL(urlText);
    const domain = getDomainFrom(url);

    // Exclude non-leaf pages
    if (_isNonLeafPage(url)) {
        return false;
    }

    // Follow user settings for domain
    const domainUserSetting = await getUserSettingForDomain(domain);
    if (domainUserSetting === "allow") {
        return true;
    }
    if (domainUserSetting === "deny") {
        return false;
    }

    // Follow default settings for domain
    if (defaultExcludedDomains.includes(domain)) {
        return false;
    }

    // Enable if automatic mode active
    const automaticModeEnabled = await getFeatureFlag(
        automaticallyEnabledFeatureFlag
    );
    return automaticModeEnabled;
}

// Exclude non-leaf directory pages like bbc.com or bcc.com/news.
// This uses heurstics and won't always be accurate.
function _isNonLeafPage(url) {
    // Very clearly not articles
    if (url.pathname === "/" || url.pathname.endsWith(".pdf")) {
        return true;
    }

    /*
    Exclude specific cases where the following checks fail:
        https://alexanderell.is/posts/tuner/
        https://en.wikipedia.org/wiki/Supernatural
        https://ae.studio/blog/victims-of-vimeo
        https://www.atlasobscura.com/articles/what-is-tomato-soup-cake
    */
    if (url.pathname.match(/\/(posts|wiki|blog|articles)\//)) {
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
    const dashCount = url.pathname.match(/\-/g).length;
    if (dashCount <= 1) {
        return true;
    }

    return false;
}

/*
TODO: the following urls should be enabled but are not:
    https://journals.sagepub.com/doi/10.1177/01461672221079104

    https://words.filippo.io/pay-maintainers/
    https://www.sledgeworx.io/software-leviathans/

TODO: should not be enabled here:
    https://www.nytimes.com/interactive/2022/03/11/nyregion/nyc-chinatown-signs.html
    https://www.theatlantic.com/projects/america-in-person/
*/
