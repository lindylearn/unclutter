import { parseFeed } from "htmlparser2";
import ky from "ky";
import { getBrowser, getUnclutterExtensionId, ReplicacheProxy } from "../common";
import { Article, FeedSubscription } from "../store";
import { fetchRssFeed, getArticles } from "./parse";

// fetch in background to avoid CORS issues
export async function listFeedItemsContentScript(feed: FeedSubscription): Promise<Article[]> {
    const rssFeed = await getBrowser().runtime.sendMessage(getUnclutterExtensionId(), {
        event: "fetchRssFeed",
        feedUrl: feed.rss_url,
    });
    return getArticles(rssFeed?.items);
}

// hack: can't seem to send responses to web messages, so use proxy in dev
export async function listFeedItemsWeb(feed: FeedSubscription): Promise<Article[]> {
    const html = await ky
        .get(`https://cors-anywhere.herokuapp.com/${feed.rss_url}`)
        .then((r) => r.text());
    const rssFeed = parseFeed(html);
    return getArticles(rssFeed?.items);
}

// should be called from background script
export async function refreshSubscriptions(rep: ReplicacheProxy) {
    let subscriptions = await rep.query.listSubscriptions();
    subscriptions = subscriptions.filter((s) => s.is_subscribed);
    console.log(`Checking ${subscriptions.length} article feeds...`);

    const newArticles = (await Promise.all(subscriptions.map(getNewArticles))).flat();
    if (newArticles.length > 0) {
        await rep.mutate.importArticles({ articles: newArticles });
        console.log(`Imported ${newArticles.length} new feed articles`);
    }

    await Promise.all(
        subscriptions.map((s) =>
            rep.mutate.updateSubscription({
                id: s.id,
                last_fetched: Math.round(new Date().getTime() / 1000),
            })
        )
    );
}

async function getNewArticles(subscription: FeedSubscription): Promise<Article[]> {
    const feed = await fetchRssFeed(subscription.rss_url);
    if (!feed) {
        return [];
    }

    if (!subscription.last_fetched) {
        subscription.last_fetched = 0;
    }

    const newItems = feed.items.filter(
        (item) =>
            item.pubDate && new Date(item.pubDate).getTime() / 1000 > subscription.last_fetched!
    );
    return getArticles(newItems);
}
