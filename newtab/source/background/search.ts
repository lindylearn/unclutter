import browser, { getBrowserType } from "../common/polyfill";
import { Replicache } from "replicache";
import unidecode from "unidecode";
import {
    getPartialSyncState,
    getPokeReceiver,
    PartialSyncState,
} from "@unclutter/replicache-nextjs/lib/frontend";
import {
    Article,
    getArticle,
    mutators,
} from "@unclutter/library-components/dist/store";
import {
    SearchIndex,
    SearchResult,
    syncSearchIndex,
} from "@unclutter/library-components/dist/common";

import { userInfoStore } from "../common/settings";
import { highlightExactMatch } from "../common/util";

// const apiHost = "http://localhost:3000"
const apiHost = "https://library.lindylearn.io";

let rep: Replicache = null;
export async function initSearch(): Promise<Replicache> {
    if (rep) {
        return;
    }
    const userInfo = await userInfoStore.get();
    const userId = userInfo?.userId;
    if (!userId) {
        return;
    }

    console.log("Initializing replicache...");
    rep = new Replicache({
        licenseKey: process.env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY!,
        pushURL: `${apiHost || ""}/api/replicache/push?spaceID=${userId}`,
        pullURL: `${apiHost || ""}/api/replicache/pull?spaceID=${userId}`,
        name: userId,
        mutators,
        auth: userInfo.webJwt,
    });

    rep.subscribe(getPartialSyncState, {
        onData: async (partialSync: PartialSyncState) => {
            console.log("partialSync", partialSync);
            if (partialSync !== "PARTIAL_SYNC_COMPLETE") {
                rep.pull();
            } else {
                getPokeReceiver()(userId, async () => rep.pull());
                initSearchIndex();
            }
        },
    });

    return rep;
}

let searchIndex: SearchIndex = null;
async function initSearchIndex() {
    if (searchIndex) {
        return;
    }
    console.log("Initializing search index...");

    searchIndex = new SearchIndex();
    await syncSearchIndex(rep, searchIndex as unknown as SearchIndex);

    // mark indexing done
    browser.omnibox.setDefaultSuggestion({
        description: `Search across your articles...`,
    });
}

export async function search(
    query: string
): Promise<(SearchResult & { article: Article })[]> {
    if (!searchIndex) {
        return;
    }

    const results = await searchIndex.search(query);

    const resultsWithArticles = await Promise.all(
        results.map(async (hit) => ({
            ...hit,
            article: await rep.query((tx) => getArticle(tx, hit.id)),
        }))
    );
    return resultsWithArticles.filter((hit) => hit.article !== undefined);
}

const isFirefox = getBrowserType() === "firefox";
export function mapToOmniboxSuggestion(result: SearchResult, query: string) {
    const maxTitleLen = 60;
    let title = result.article.title?.slice(0, maxTitleLen) || "";
    let paragraph = result.sentences[result.main_sentence || 0] || "";

    if (isFirefox) {
        // firefox does not recognize XML markup
        return {
            content: result.article.url,
            description: `${title}: ${paragraph}`,
        };
    }

    // highlight query text match
    title = highlightExactMatch(title, query);
    paragraph = highlightExactMatch(paragraph, query);

    // escape chars like "&", otherwise throws error
    // do after text match to avoid invalidating match
    title = escapeHtmlText(title);
    paragraph = escapeHtmlText(paragraph);

    return {
        content: result.article.url,
        description: `${title} <dim>…${paragraph}</dim>`,
    };
}

// from https://stackoverflow.com/questions/40263803/native-javascript-or-es6-way-to-encode-and-decode-html-entities
function escapeHtmlText(str: string): string {
    str = unidecode(str);
    str = str.replace(
        /[&<>'"]/g,
        (tag) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                '"': "&quot;",
            }[tag])
    );

    // allow match syntax
    str = str
        .replace("&lt;match&gt;", "<match>")
        .replace("&lt;/match&gt;", "</match>");

    return str;
}
