import { openArticle } from "@unclutter/library-components/dist/common";
import type { Runtime, Omnibox } from "webextension-polyfill";
import debounce from "lodash/debounce";

import browser, { getBrowserType } from "../common/polyfill";
import { userInfoStore } from "../common/settings";
import { reportEvent } from "./metrics";
import { initSearch, mapToOmniboxSuggestion, search } from "./search";
import { googleSearchDomains } from "../common/util";

console.log("worker loaded");

// handle events from unclutter library website or firefox content script proxy
browser.runtime.onMessage.addListener(processEvent);
browser.runtime.onMessageExternal.addListener(processEvent);

function processEvent(
    message: any,
    sender: Runtime.MessageSender,
    sendResponse: any
) {
    if (message.event === "setLibraryAuth") {
        console.log("Set library login");
        userInfoStore.set({
            userId: message.userId,
            webJwt: message.webJwt,
        });
        initSearch();
    } else if (message.event === "reportEvent") {
        reportEvent(message.name, message.data);
    } else if (message.event === "getSearchResults") {
        search(message.query).then((results) => {
            sendResponse(results);
        });
        return true;
    } else if (message.event === "openLibrary") {
        browser.tabs.update(undefined, {
            url: `https://library.lindylearn.io/`,
        });
    } else if (message.event === "activateSearchIntegration") {
        registerContentScript();
    } else if (message.event === "isSearchInstalled") {
        isContentScriptRegistered().then(sendResponse);
        return true;
    }
}

async function isContentScriptRegistered() {
    try {
        if (!browser.scripting) {
            return false;
        }
        const scripts = await browser.scripting.getRegisteredContentScripts();
        return scripts.some(
            (script) => script.id === "unclutter-search-integration"
        );
    } catch {
        return false;
    }
}
async function registerContentScript() {
    if (await isContentScriptRegistered()) {
        return;
    }
    try {
        if (getBrowserType() === "firefox") {
            browser.scripting.registerContentScripts([
                {
                    id: "unclutter-search-integration",
                    js: ["../content-script/search.js"],
                    matches: googleSearchDomains,
                    persistAcrossSessions: false, // true not supported until v105
                },
            ]);
        } else {
            await browser.scripting.registerContentScripts([
                {
                    id: "unclutter-search-integration",
                    js: ["content-script/search.js"],
                    matches: googleSearchDomains,
                },
            ]);
        }

        console.log("Registered content script");
    } catch (err) {
        console.log(err);
    }
}
registerContentScript(); // must re-register after updates (permissions stay the same)

initSearch();

browser.omnibox.setDefaultSuggestion({
    description: `Article search is still indexing...`,
});
browser.omnibox.onInputChanged.addListener(
    async (
        query: string,
        suggest: (suggestions: Omnibox.SuggestResult[]) => void
    ) => {
        const results = await search(query);
        browser.omnibox.setDefaultSuggestion({
            description: `Found ${results.length} articles.`,
        });

        suggest(results.map((result) => mapToOmniboxSuggestion(result, query)));
        debouncedSearchEvent();
    }
);
const debouncedSearchEvent = debounce(() => {
    reportEvent("searchOmnibox");
}, 2000);

browser.omnibox.onInputEntered.addListener(
    (query: string, disposition: Omnibox.OnInputEnteredDisposition) => {
        reportEvent("selectOmniboxResult");
        if (!query.startsWith("http")) {
            // default suggestion
            browser.tabs.create({
                url: `https://library.lindylearn.io/search?q=${encodeURIComponent(
                    query
                )}`,
            });
            return;
        }

        switch (disposition) {
            case "currentTab":
                openArticle(query, false);
                break;
            case "newForegroundTab":
                openArticle(query, true);
                break;
            case "newBackgroundTab":
                openArticle(query, true);
                break;
        }
    }
);
