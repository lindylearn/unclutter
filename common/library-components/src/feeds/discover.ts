import { JSDOM } from "jsdom";

const FEED_TYPES = [
    "application/atom+xml",
    "application/json",
    "application/rdf+xml",
    "application/rss+xml",
    "application/x.atom+xml",
    "application/x-atom+xml",
    "text/atom+xml",
    "text/plain",
    "text/rdf+xml",
    "text/rss+xml",
    "text/xml",
];

export async function discoverFeedsInDocument(
    document: Document,
    sourceUrl: string
): Promise<string[]> {
    // adapted from https://github.com/adbar/trafilatura/blob/aa0f0a55ec40b0d9347a771bbeed9e4f5ef72dd9/trafilatura/feeds.py and https://github.com/DIYgod/RSSHub-Radar/blob/master/src/js/content/utils.js

    let feedUrls: string[] = [];

    // parse HTML
    document.querySelectorAll("link[href]").forEach((link: HTMLLinkElement) => {
        if (link.type && FEED_TYPES.includes(link.type)) {
            feedUrls.push(link.href);
        } else if (link.href.includes("rss") || link.href.includes("atom")) {
            feedUrls.push(link.href);
        }
    });
    if (feedUrls.length === 0) {
        document.querySelectorAll("a[href]").forEach((link: HTMLAnchorElement) => {
            if (
                [".rss", ".rdf", ".xml", ".atom"].some((end) =>
                    link.href.toLowerCase().endsWith(end)
                )
            ) {
                feedUrls.push(link.href);
            } else if (link.href.includes("rss") || link.href.includes("atom")) {
                feedUrls.push(link.href);
            }
        });
    }

    // filter out invalid URLs
    feedUrls = feedUrls
        .map((url) => {
            if (url.startsWith("/")) {
                return new URL(url, new URL(sourceUrl).origin).href;
            }
            if (url === sourceUrl) {
                return null;
            }
            if (url.includes("comments")) {
                return null;
            }
            try {
                new URL(url);
            } catch {
                return null;
            }
            return url;
        })
        .filter((url) => url !== null) as string[];

    // TODO also consider
    // RSSHub rules, see https://github.com/DIYgod/RSSHub-Radar/blob/master/src/js/common/radar-rules.js
    // hosted rss-proxy, see https://github.com/damoeb/rss-proxy/
    // Google News search, see trafilatura

    return feedUrls;
}

// fallback
export async function discoverDomainFeeds(sourceUrl: string): Promise<string[]> {
    // TODO fix node.js bundle issue
    // try to find feed on homepage
    // e.g. https://jrsinclair.com/articles/2022/why-would-anyone-need-javascript-generator-functions/
    // const origin = new URL(sourceUrl).origin;
    // const html = await fetch(origin).then((response) => response.text());
    // const document: Document = new JSDOM(html).window.document;
    // if (document) {
    //     const feeds = await discoverFeedsInDocument(document, sourceUrl);
    //     if (feeds.length > 0) {
    //         console.log("Found feed on homepage");
    //         return feeds;
    //     }
    // }

    // TODO try feeds. ?

    return [];
}

export const FEED_SUFFIXES = ["/feed", "/index", "/rss", "/atom"];
export const FEED_EXTENSIONS = [".rss", ".xml", ".rss", ".atom"];
export function getHeuristicFeedUrls(sourceUrl: string): string[] {
    const url = new URL(sourceUrl);
    const feedUrls: string[] = [];
    FEED_SUFFIXES.forEach((suffix) => {
        FEED_EXTENSIONS.concat([""]).forEach((extension) => {
            if (suffix === "/index" && extension === "") {
                return;
            }
            feedUrls.push(url.origin + suffix + extension);
        });
    });
    return feedUrls;
}
