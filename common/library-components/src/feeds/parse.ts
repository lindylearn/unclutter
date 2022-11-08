import { parseFeed } from "htmlparser2";
import { getDomain } from "../common/util";
import ky from "ky";
import { Feed } from "domutils";

export async function getMainFeed(
    sourceUrl: string,
    rssUrls: string[]
): Promise<WebsiteFeed | null> {
    console.log(`Trying ${rssUrls.length} feed urls`, rssUrls);
    for (const feedUrl of rssUrls) {
        try {
            const html = await ky.get(feedUrl).then((r) => r.text());
            const feed = parseFeed(html);
            if (feed && feed.items.length > 0) {
                console.log(`Found feed at ${feedUrl}:`, feed);
                return constructFeed(sourceUrl, feedUrl, feed);
            }
        } catch {}
    }
    return null;
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
    const [articlesPerDay, postFrequency] = getPostFrequency(feed);
    if (articlesPerDay > 1) {
        // ignore noisy feeds
        return null;
    }

    return {
        rssUrl,
        link: feed.link || sourceUrl,
        domain: getDomain(sourceUrl),
        title: feed.title,
        postFrequency,
    };
}

export function getPostFrequency(feed: Feed): [number, string | null] {
    // ignore very old feed items, e.g. for https://signal.org/blog/introducing-stories/
    feed.items = feed.items.slice(0, 10);

    const start = feed.items[feed.items.length - 1].pubDate;
    if (!start) {
        return [0, null];
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
