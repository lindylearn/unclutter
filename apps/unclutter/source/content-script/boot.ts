import {
    extensionSupportsUrl,
    isConfiguredToEnable,
    isDeniedForDomain,
    isNonLeafPage,
    isArticleByTextContent,
} from "../common/articleDetection";
import {
    enableBootUnclutterMessage,
    enableExperimentalFeatures,
    getFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getDomainFrom } from "../common/util";

// script injected into every tab before dom constructed
// if configured by the user, initialize the extension functionality
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

    let triggeredIsLikelyArticle = false;

    // url heuristic check
    if (!isNonLeafPage(url)) {
        onIsLikelyArticle(domain);
        triggeredIsLikelyArticle = true;
    }

    // check local url map for article annotation count matches
    // const foundCount = await browser.runtime.sendMessage(null, {
    //     event: "checkLocalAnnotationCount",
    // });
    // if (foundCount && !triggeredIsLikelyArticle) {
    //     console.log("Found annotations count, assuming this is an article");
    //     onIsLikelyArticle(domain);
    // }

    if (["unclutter.lindylearn.io", "library.lindylearn.io", "localhost"].includes(domain)) {
        listenForPageEvents();
    }

    // run assistant independently of non-leaf detection
    const experimentsEnabled = await getFeatureFlag(enableExperimentalFeatures);
    if (experimentsEnabled) {
        // accessing text content requires ready dom
        await waitUntilDomLoaded();

        if (isArticleByTextContent()) {
            requestEnhance("boot", "highlights");
        }
    }
}

async function onIsLikelyArticle(domain: string) {
    const configuredEnable = await isConfiguredToEnable(domain);
    const enableUnclutterMessage = await getFeatureFlag(enableBootUnclutterMessage);
    if (configuredEnable) {
        requestEnhance("allowlisted");
    } else if (false && enableUnclutterMessage) {
        // showUnclutterMessage();
    }
}

function requestEnhance(trigger: string, type = "full") {
    browser.runtime.sendMessage(null, {
        event: "requestEnhance",
        trigger,
        type,
    });
}

// handle events from the browser extension install page & integrated article library
// adding externally_connectable may not work for existing installs, and isn't supported on firefox
function listenForPageEvents() {
    window.addEventListener("message", function (event) {
        if (
            ["openOptionsPage", "openLinkWithUnclutter", "setLibraryAuth"].includes(
                event.data.event
            )
        ) {
            browser.runtime.sendMessage(event.data);
        }
    });
}

async function waitUntilDomLoaded(): Promise<void> {
    return new Promise((resolve) => {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => resolve());
        } else {
            resolve();
        }
    });
}

boot();
