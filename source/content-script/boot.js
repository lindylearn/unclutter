import { getDomainFrom } from "source/common/util";
import {
    extensionSupportsUrl,
    isConfiguredToEnable,
    isDeniedForDomain,
    isNonLeafPage,
} from "../common/articleDetection";
import browser from "../common/polyfill";
import { displayToast } from "./overlay/toast";

// script injected into every tab before dom constructed
// if configured by the user, initialize the extension funcationality
async function boot() {
    const url = new URL(window.location.href);
    const domain = getDomainFrom(url);

    if (!extensionSupportsUrl(url) || isNonLeafPage(url)) {
        return;
    }
    const deniedForDomain = await isDeniedForDomain(domain);
    if (deniedForDomain) {
        return;
    }

    const configuredEnable = await isConfiguredToEnable(domain);
    if (configuredEnable) {
        enablePageView();
    } else {
        document.addEventListener("DOMContentLoaded", (event) => {
            displayToast("Unclutter this article?", enablePageView);
        });
    }
}

function enablePageView() {
    // request injection of additional extension functionality
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
    });
}

boot();
