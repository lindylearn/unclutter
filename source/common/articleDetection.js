import { defaultExcludedDomains } from "./defaultStorage";
import {
    automaticallyEnabledFeatureFlag,
    getFeatureFlag,
} from "./featureFlags";
import { getUserSettingForDomain } from "./storage";
import { getDomainFrom } from "./util";

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

// Exclude non-leaf directory pages like bbc.com or bcc.com/news
function _isNonLeafPage(url) {
    if (url.pathname === "/" || url.pathname.endsWith(".pdf")) {
        return true;
    }

    return false;
}
