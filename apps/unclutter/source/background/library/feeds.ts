import {
    getMainFeed,
    discoverDomainFeeds,
    getHeuristicFeedUrls,
    fetchParseFeedForUrl,
} from "@unclutter/library-components/dist/feeds";
import { FeedSubscription } from "@unclutter/library-components/dist/store";

export async function discoverRssFeed(
    sourceUrl: string,
    feedCandidates: string[],
    tagLinkCandidates: string[]
): Promise<FeedSubscription | null> {
    // TODO check main feed frequency first

    if (tagLinkCandidates.length > 0) {
        const tagFeed = await fetchParseFeedForUrl(tagLinkCandidates[0]);
        console.log("Fetched main tag feed", tagLinkCandidates, tagFeed);

        if (tagFeed) {
            return tagFeed;
        }
    }

    if (feedCandidates.length === 0) {
        feedCandidates = await discoverDomainFeeds(sourceUrl);
    }

    // try if other candidates invalid
    feedCandidates.push(...getHeuristicFeedUrls(sourceUrl));

    // TODO also consider
    // RSSHub rules, see https://github.com/DIYgod/RSSHub-Radar/blob/master/src/js/common/radar-rules.js
    // hosted rss-proxy, see https://github.com/damoeb/rss-proxy/
    // Google News search, see trafilatura

    return await getMainFeed(sourceUrl, feedCandidates);
}
