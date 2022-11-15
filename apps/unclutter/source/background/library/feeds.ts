import {
    getMainFeed,
    discoverDomainFeeds,
    getHeuristicFeedUrls,
    fetchParseFeedForUrl,
    getGoogleNewsFeed,
} from "@unclutter/library-components/dist/feeds";
import { FeedSubscription } from "@unclutter/library-components/dist/store";

export async function discoverRssFeed(
    sourceUrl: string,
    feedCandidates: string[],
    tagLinkCandidates: string[]
): Promise<FeedSubscription | null> {
    // try specific tag feeds
    if (tagLinkCandidates.length > 0) {
        // use only first tag
        const feed = await fetchParseFeedForUrl(tagLinkCandidates[0]);
        console.log("Fetched tag feeds", tagLinkCandidates, feed);

        if (feed) {
            return feed;
        }
    }

    // try feeds correctly linked in html
    let feed = await getMainFeed(sourceUrl, feedCandidates);
    if (feed) {
        return feed;
    }

    // try common feed urls
    feed = await getMainFeed(sourceUrl, getHeuristicFeedUrls(sourceUrl));
    if (feed) {
        return feed;
    }

    // try google news search
    feed = await getGoogleNewsFeed(sourceUrl);
    if (feed) {
        return feed;
    }

    return null;
}
