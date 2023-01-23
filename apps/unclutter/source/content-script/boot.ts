import { getUserInfoSimple } from "@unclutter/library-components/dist/common/messaging";
import {
    extensionSupportsUrl,
    isConfiguredToEnable,
    isDeniedForDomain,
    isNonLeafPage,
    isArticleByTextContent,
} from "../common/articleDetection";
import browser from "../common/polyfill";
import { getDomain } from "@unclutter/library-components/dist/common/util";

// script injected into every tab before dom construction
// if configured by the user, initialize the extension functionality

async function boot() {
    const url = new URL(window.location.href);
    const domain = getDomain(window.location.href);

    // reset badge count for tab after navigation
    browser.runtime.sendMessage(null, {
        event: "clearTabState",
    });

    // hard denylists
    if (!extensionSupportsUrl(url) || (await isDeniedForDomain(domain))) {
        return;
    }

    // events from the Unclutter companion websites
    if (
        [
            "unclutter.lindylearn.io",
            "library.lindylearn.io",
            "my.unclutter.it",
            "localhost", // dev testing
        ].includes(domain)
    ) {
        listenForPageEvents();
    }

    // check if the user already annotated this page
    const foundCount = await browser.runtime.sendMessage(null, {
        event: "checkHasLocalAnnotations",
    });
    if (foundCount) {
        onIsLikelyArticle(domain);
    }

    // url heuristic check to detect likely article pages (has many false negatives)
    if (!isNonLeafPage(url)) {
        onIsLikelyArticle(domain);
    }

    // accessing text content requires ready dom
    await waitUntilDomLoaded();
    if (isArticleByTextContent()) {
        onIsLikelyArticle(domain);

        // parse the article for annotations if enabled
        const userInfo = await getUserInfoSimple();
        if (userInfo?.aiEnabled) {
            // handle rest in highlights.ts
            requestEnhance("boot", "highlights");
        }
    }
}

async function onIsLikelyArticle(domain: string) {
    // enabled the extension if enabled by the user
    const automaticEnable = await isConfiguredToEnable(domain);
    if (automaticEnable) {
        requestEnhance("allowlisted");
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
    // return browser bookmarks to import into the extension's companion website, if the user triggered it
    browser.runtime.onMessage.addListener((message) => {
        if (message.event === "returnBrowserBookmarks") {
            window.postMessage(message, "*");
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
