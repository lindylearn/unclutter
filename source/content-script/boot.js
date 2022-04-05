import { getDomainFrom } from "source/common/util";
import isConfiguredToEnable, {
    extensionSupportsUrl,
    isNonLeafPage,
} from "../common/articleDetection";
import browser from "../common/polyfill";
import { displayToast } from "./overlay/toast";

// script injected into every tab before dom constructed
// if configured by the user, initialize the extension funcationality
async function boot() {
    const url = new URL(window.location.href);
    const domain = getDomainFrom(url);

    // don't do anything for unsupported or likely non-article pages
    if (!extensionSupportsUrl(url) || isNonLeafPage(url)) {
        console.log("non-leaf");
        return;
    }

    const configuredEnable = await isConfiguredToEnable(domain);
    console.log("configuredEnable", configuredEnable);
    if (configuredEnable) {
        enablePageView();
    } else {
        displayToast("Unclutter this article?", enablePageView);
    }
}

function enablePageView() {
    // request injection of additional extension functionality
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
    });
}

boot();
