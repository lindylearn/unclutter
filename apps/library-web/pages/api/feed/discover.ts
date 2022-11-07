import { discoverRssFeed } from "@unclutter/library-components/dist/feeds";

export default async function handler(req, res) {
    const feedUrl = await discoverRssFeed(req.query.url);

    res.status(200).json({ feedUrl });
}
