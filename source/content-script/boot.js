import {
    enableBootUnclutterMessage,
    getFeatureFlag,
} from "source/common/featureFlags";
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
    const enableUnclutterMessage = await getFeatureFlag(
        enableBootUnclutterMessage
    );
    if (configuredEnable) {
        enablePageView();
    } else if (enableUnclutterMessage) {
        let loaded = false;
        window.addEventListener("load", function () {
            if (loaded) {
                // Sometimes this triggers multiple times, e.g. on https://www.smithsonianmag.com/science-nature/why-have-female-animals-evolved-such-wild-genitals-180979813/
                return;
            }
            loaded = true;

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
