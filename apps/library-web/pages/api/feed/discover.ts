import { getMainFeed } from "@unclutter/library-components/dist/feeds";

export default async function handler(req, res) {
    const feed = await getMainFeed(req.query.url);

    res.status(200).json(feed);
}
