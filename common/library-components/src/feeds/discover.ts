import { parseFeed } from "htmlparser2";
import { getDomain } from "../common/util";
import ky from "ky";
import { Feed } from "domutils";

// import Parser from "rss-parser";
// const parser = new Parser();

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

export async function getMainFeed(
    sourceUrl: string,
    rssUrls: string[]
): Promise<WebsiteFeed | null> {
    for (const feedUrl of rssUrls) {
        try {
            const html = await ky.get(feedUrl).then((r) => r.text());
            const feed = parseFeed(html);
            if (feed && feed.items.length > 0) {
                return constructFeed(sourceUrl, feedUrl, feed);
            }
        } catch (e) {
            console.error(e);
        }
    }
    return null;
}

export async function discoverFeeds(document: Document, sourceUrl: string): Promise<string[]> {
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

export interface WebsiteFeed {
    rssUrl: string;
    link: string;
    domain?: string;
    title?: string;
    postFrequency: string | null;
}

function constructFeed(sourceUrl: string, rssUrl: string, feed: Feed | null): WebsiteFeed | null {
    if (!feed) {
        return null;
    }
    return {
        rssUrl,
        link: feed.link || sourceUrl,
        domain: getDomain(sourceUrl),
        title: feed.title,
        postFrequency: getHumanPostFrequency(feed),
    };
}

export function getHumanPostFrequency(feed: Feed | null): string | null {
    if (!feed) {
        return null;
    }

    const start = feed.items[feed.items.length - 1].pubDate;
    if (!start) {
        return null;
    }
    const end = new Date();
    const days = Math.round((end.getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 60));

    const articlesPerDay = Math.round(feed.items.length / days);
    if (articlesPerDay >= 1) {
        return `${articlesPerDay} article${articlesPerDay !== 1 ? "s" : ""} per day`;
    }
    const articlesPerWeek = Math.round(feed.items.length / (days / 7));
    if (articlesPerWeek >= 1) {
        return `${articlesPerWeek} article${articlesPerWeek !== 1 ? "s" : ""} per week`;
    }
    const articlesPerMonth = Math.round(feed.items.length / (days / 30));
    if (articlesPerMonth >= 1) {
        return `${articlesPerMonth} article${articlesPerMonth !== 1 ? "s" : ""} per month`;
    }
    const articlesPerYear = Math.round(feed.items.length / (days / 365));
    if (articlesPerYear >= 1) {
        return `${articlesPerYear} article${articlesPerYear !== 1 ? "s" : ""} per year`;
    }

    return null;
}
