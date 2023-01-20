import { parseFeed, parseDocument } from "htmlparser2";
import { cleanTitle, getDomain } from "../common/util";
import ky from "ky";
import { Feed, FeedItem, textContent } from "domutils";
import { Article, FeedSubscription } from "../store";
import { getUrlHash } from "../common";
import { FEED_EXTENSIONS } from "./discover";

export async function getMainFeed(
    sourceUrl: string,
    rssUrls: string[]
): Promise<FeedSubscription | null> {
    for (const feedUrl of rssUrls) {
        try {
            const feed = await fetchRssFeed(feedUrl);
            if (feed && feed.items.length > 0) {
                const subscription = constructFeedSubscription(sourceUrl, feedUrl, feed);
                console.log(`Parsed valid feed at ${feedUrl}`);
                return subscription;
            }
        } catch {}
    }
    return null;
}

export async function fetchRssFeed(feedUrl: string): Promise<Feed | null> {
    const html = await ky.get(feedUrl).then((r) => r.text());
    return parseFeed(html);
}

function constructFeedSubscription(
    sourceUrl: string,
    rssUrl: string,
    feed: Feed | null
): FeedSubscription | null {
    if (!feed) {
        return null;
    }
    const postFrequency = getPostFrequency(feed);

    const domain = getDomain(sourceUrl);
    if (!domain) {
        return null;
    }
    // ignore rss links, e.g. for http://liuliu.me/atom.xml
    if (feed.link && FEED_EXTENSIONS.some((e) => feed.link!.endsWith(e))) {
        feed.link = undefined;
    }

    return {
        id: rssUrl,
        rss_url: rssUrl,
        link: feed.link || `https://${domain}`,
        domain,
        title: feed.title,
        description: feed.description,
        author: feed.author,
        post_frequency: postFrequency,
        time_added: Math.round(new Date().getTime() / 1000),
    };
}

export function getPostFrequency(feed: Feed): FeedSubscription["post_frequency"] | undefined {
    if (feed.items.length < 5) {
        return undefined;
    }

    // sort reverse-chronologically
    // ignore very old feed items, e.g. for https://signal.org/blog/introducing-stories/
    feed.items = feed.items
        .filter((i) => i.pubDate)
        .sort((a, b) => new Date(b.pubDate!).getTime() - new Date(a.pubDate!).getTime())
        .slice(0, 10);

    const start = feed.items[feed.items.length - 1].pubDate;
    if (!start) {
        return undefined;
    }
    const end = new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const articlesPerDay = Math.round(feed.items.length / days);
    const articlesPerWeek = Math.round(feed.items.length / (days / 7));
    const articlesPerMonth = Math.round(feed.items.length / (days / 30));
    const articlesPerYear = Math.round(feed.items.length / (days / 365));
    if (articlesPerDay >= 1) {
        return {
            per_week: articlesPerWeek,
            count: articlesPerDay,
            period: "day",
        };
    } else if (articlesPerWeek >= 1) {
        return {
            per_week: articlesPerWeek,
            count: articlesPerWeek,
            period: "week",
        };
    } else if (articlesPerMonth >= 1) {
        return {
            per_week: articlesPerWeek,
            count: articlesPerMonth,
            period: "month",
        };
    } else if (articlesPerYear >= 1) {
        return {
            per_week: articlesPerWeek,
            count: articlesPerYear,
            period: "year",
        };
    }

    return undefined;
}

export function parseFeedArticles(
    rssUrl: string,
    items?: FeedItem[],
    isTemporary: boolean = true
): Article[] {
    if (!items) {
        return [];
    }

    return items.map((item) => {
        let url = item.link;
        if (!url) {
            url = `https://${getDomain(rssUrl)}`;
        }
        if (url.startsWith("/")) {
            url = new URL(url, new URL(rssUrl).origin).href;
        }

        // parse XML, e.g. for https://new.pythonforengineers.com/blog/web-automation-dont-use-selenium-use-playwright/
        let description = item.description;
        if (description?.startsWith("<")) {
            const dom = parseDocument(description);
            description = textContent(dom);
        }

        return {
            id: getUrlHash(url),
            url,
            title: cleanTitle(item.title || "") || item.link!,
            word_count: 0,
            publication_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            time_added: isTemporary ? 0 : Math.round(new Date(item.pubDate!).getTime() / 1000),
            reading_progress: 0.0,
            topic_id: null,
            is_favorite: false,
            description: isTemporary ? description?.slice(0, 150) : undefined,
            is_temporary: isTemporary || undefined,
            is_new: !isTemporary || undefined,
        };
    });
}
