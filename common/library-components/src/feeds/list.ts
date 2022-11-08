import { getBrowser, getUnclutterExtensionId, getUrlHash } from "../common";

import { Article, FeedSubscription } from "../store";

export async function listFeedItemsContentScript(feed: FeedSubscription): Promise<Article[]> {
    // fetch in background to avoid CORS issues
    const rssFeed = await getBrowser().runtime.sendMessage(getUnclutterExtensionId(), {
        event: "fetchRssFeed",
        feedUrl: feed.rss_url,
    });
    console.log(rssFeed);

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
