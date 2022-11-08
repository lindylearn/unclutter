import {
    getMainFeed,
    discoverDomainFeeds,
    getHeuristicFeedUrls,
} from "@unclutter/library-components/dist/feeds";
import { FeedSubscription } from "@unclutter/library-components/dist/store";

export async function parseRssFeeds(
    sourceUrl: string,
    feedUrls: string[]
): Promise<FeedSubscription> {
    if (feedUrls.length === 0) {
        feedUrls = await discoverDomainFeeds(sourceUrl);
    }
    if (feedUrls.length === 0) {
        feedUrls = getHeuristicFeedUrls(sourceUrl);
    }

    return await getMainFeed(sourceUrl, feedUrls);
}
