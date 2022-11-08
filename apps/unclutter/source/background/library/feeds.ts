import {
    getMainFeed,
    WebsiteFeed,
    discoverDomainFeeds,
    getHeuristicFeedUrls,
} from "@unclutter/library-components/dist/feeds";

export async function parseRssFeeds(sourceUrl: string, feedUrls: string[]): Promise<WebsiteFeed> {
    if (feedUrls.length === 0) {
        feedUrls = await discoverDomainFeeds(sourceUrl);
    }
    if (feedUrls.length === 0) {
        feedUrls = getHeuristicFeedUrls(sourceUrl);
    }

    return await getMainFeed(sourceUrl, feedUrls);
}
