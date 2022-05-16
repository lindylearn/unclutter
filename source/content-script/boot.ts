import {
    extensionSupportsUrl,
    isConfiguredToEnable,
    isDeniedForDomain,
    isNonLeafPage,
} from "../common/articleDetection";
import {
    enableBootUnclutterMessage,
    getFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getDomainFrom } from "../common/util";
import { displayToast } from "../overlay/toast";

// script injected into every tab before dom constructed
// if configured by the user, initialize the extension funcationality
async function boot() {
    const url = new URL(window.location.href);
    const domain = getDomainFrom(url);

    // hard denylists
    if (!extensionSupportsUrl(url)) {
        return;
    }
    const deniedForDomain = await isDeniedForDomain(domain);
    if (deniedForDomain) {
        return;
    }

    // check local url map for article matches (will trigger enhance.ts injection if succeeds)
    browser.runtime.sendMessage(null, {
        event: "showAnnotationsCount",
    });

    // heuristic check
    if (isNonLeafPage(url)) {
        return;
    }

    const configuredEnable = await isConfiguredToEnable(domain);
    const enableUnclutterMessage = await getFeatureFlag(
        enableBootUnclutterMessage
    );
    if (configuredEnable) {
        enablePageView("allowlisted");
    } else if (enableUnclutterMessage) {
        let loaded = false;
        window.addEventListener("load", function () {
            if (loaded) {
                // Sometimes this triggers multiple times, e.g. on https://www.smithsonianmag.com/science-nature/why-have-female-animals-evolved-such-wild-genitals-180979813/
                return;
            }
            loaded = true;

            displayToast("Unclutter article", () => {
                enablePageView("message");
            });
        });
    }
}

function enablePageView(trigger) {
    // request injection of additional extension functionality
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
        trigger,
    });
}

boot();
