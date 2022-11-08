import { Feed } from "domutils";
import { parseFeed } from "htmlparser2";
import ky from "ky";
import { getBrowser, getUnclutterExtensionId, getUrlHash } from "../common";
import { Article, FeedSubscription } from "../store";

// fetch in background to avoid CORS issues
export async function listFeedItemsContentScript(feed: FeedSubscription): Promise<Article[]> {
    const rssFeed = await getBrowser().runtime.sendMessage(getUnclutterExtensionId(), {
        event: "fetchRssFeed",
        feedUrl: feed.rss_url,
    });
    return getArticles(rssFeed);
}

// can't seem to send responses to web messages, so use proxy in dev
export async function listFeedItemsWeb(feed: FeedSubscription): Promise<Article[]> {
    const html = await ky
        .get(`https://cors-anywhere.herokuapp.com/${feed.rss_url}`)
        .then((r) => r.text());
    const rssFeed = parseFeed(html);
    return getArticles(rssFeed);
}

function getArticles(rssFeed: Feed | null) {
    if (!rssFeed) {
        return [];
    }
    return rssFeed.items.map((item) => ({
        id: getUrlHash(item.link!),
        url: item.link!,
        title: item.title || item.link!,
        word_count: 0,
        publication_date: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        time_added: 0,
        reading_progress: 0.0,
        topic_id: null,
        is_favorite: false,
    }));
}
