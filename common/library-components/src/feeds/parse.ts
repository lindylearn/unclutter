import { parseFeed } from "htmlparser2";
import { getDomain } from "../common/util";
import ky from "ky";
import { Feed } from "domutils";

export async function getMainFeed(
    sourceUrl: string,
    rssUrls: string[]
): Promise<WebsiteFeed | null> {
    console.log(`Trying ${rssUrls.length} feed urls...`);
    for (const feedUrl of rssUrls) {
        try {
            const html = await ky.get(feedUrl).then((r) => r.text());
            const feed = parseFeed(html);
            if (feed && feed.items.length > 0) {
                console.log(`Found feed at ${feedUrl}`);
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

    // ignore very old feed items, e.g. for https://signal.org/blog/introducing-stories/
    feed.items = feed.items.slice(0, 10);

    const start = feed.items[feed.items.length - 1].pubDate;
    if (!start) {
        return null;
    }
    const end = new Date();
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

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
