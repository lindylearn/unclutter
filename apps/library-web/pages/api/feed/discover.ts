import { JSDOM } from "jsdom";
import { getMainFeed } from "@unclutter/library-components/dist/feeds";

export default async function handler(req, res) {
    const sourceUrl = req.query.url;

    const html = await fetch(sourceUrl).then((response) => response.text());
    const document: Document = new JSDOM(html).window.document;
    if (!document) {
        console.error("Invalid HTML");
        return [];
    }

    const feed = await getMainFeed(document, sourceUrl);

    res.status(200).json(feed);
}
