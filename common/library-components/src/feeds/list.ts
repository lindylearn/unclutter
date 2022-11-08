import { parseFeed } from "htmlparser2";
import ky from "ky";
import { getUrlHash } from "../common";

import { Article, FeedSubscription } from "../store";

export async function listFeedItems(feed: FeedSubscription): Promise<Article[]> {
    const html = await ky
        .get(`https://cors-anywhere.herokuapp.com/${feed.rss_url}`)
        .then((r) => r.text());
    const rssFeed = parseFeed(html);
    if (!rssFeed) {
        return [];
    }

    return rssFeed.items.map((item) => ({
        id: getUrlHash(item.link!),
        url: item.link!,
        title: item.title || item.link!,
        word_count: 0,
        publication_date: item.pubDate?.toISOString() || null,
        time_added: 0,
        reading_progress: 0.0,
        topic_id: null,
        is_favorite: false,
    }));
}
