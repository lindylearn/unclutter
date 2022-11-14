import ky from "ky";
import { parseHTML } from "linkedom";
import { FeedSubscription } from "../store";
import { discoverFeedsInDocument } from "./discover";
import { getMainFeed } from "./parse";

export async function fetchParseFeedForUrl(url: string): Promise<FeedSubscription | null> {
    const html = await ky.get(url).then((r) => r.text());
    const { document } = parseHTML(html);
    if (!document) {
        return null;
    }

    const feedUrls = await discoverFeedsInDocument(document, url);
    return getMainFeed(url, feedUrls);
}
