import { parseFeed } from "htmlparser2";
import { cleanTitle, getDomain } from "../common/util";
import ky from "ky";
import { Feed, FeedItem } from "domutils";
import { Article, FeedSubscription } from "../store";
import { getUrlHash } from "../common";

export async function getMainFeed(
    sourceUrl: string,
    rssUrls: string[]
): Promise<FeedSubscription | null> {
    // console.log(`Trying ${rssUrls.length} feed urls`, rssUrls);
    for (const feedUrl of rssUrls) {
        try {
            const feed = await fetchRssFeed(feedUrl);
            if (feed && feed.items.length > 0) {
                console.log(`Found feed at ${feedUrl}:`, feed);
                return constructFeedSubscription(sourceUrl, feedUrl, feed);
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
    const [articlesPerDay, postFrequency] = getPostFrequency(feed);
    if (articlesPerDay > 1) {
        // ignore noisy feeds
        return null;
    }

    return {
        id: rssUrl,
        rss_url: rssUrl,
        link: feed.link || sourceUrl,
        domain: getDomain(sourceUrl),
        title: feed.title,
        description: feed.description,
        author: feed.author,
        post_frequency: postFrequency,
        time_added: Math.round(new Date().getTime() / 1000),
    };
}

export function getPostFrequency(feed: Feed): [number, string | undefined] {
    // ignore very old feed items, e.g. for https://signal.org/blog/introducing-stories/
    feed.items = feed.items.slice(0, 10);

    const start = feed.items[feed.items.length - 1].pubDate;
    if (!start) {
        return [0, undefined];
    }
    const end = new Date();
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    let humanFrequency: string;
    const articlesPerDay = Math.round(feed.items.length / days);
    const articlesPerWeek = Math.round(feed.items.length / (days / 7));
    const articlesPerMonth = Math.round(feed.items.length / (days / 30));
    const articlesPerYear = Math.round(feed.items.length / (days / 365));
    if (articlesPerDay >= 1) {
        humanFrequency = `${articlesPerDay} article${articlesPerDay !== 1 ? "s" : ""} per day`;
    } else if (articlesPerWeek >= 1) {
        humanFrequency = `${articlesPerWeek} article${articlesPerWeek !== 1 ? "s" : ""} per week`;
    } else if (articlesPerMonth >= 1) {
        humanFrequency = `${articlesPerMonth} article${
            articlesPerMonth !== 1 ? "s" : ""
        } per month`;
    } else if (articlesPerYear >= 1) {
        humanFrequency = `${articlesPerYear} article${articlesPerYear !== 1 ? "s" : ""} per year`;
    } else {
        humanFrequency = `no recent articles`;
    }

    return [articlesPerDay, humanFrequency];
}

export function getArticles(items?: FeedItem[]): Article[] {
    if (!items) {
        return [];
    }
    return items.map((item) => ({
        id: getUrlHash(item.link!),
        url: item.link!,
        title: cleanTitle(item.title || "") || item.link!,
        word_count: 0,
        publication_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        time_added: 0,
        reading_progress: 0.0,
        topic_id: null,
        is_favorite: false,
        description: item.description,
    }));
}
