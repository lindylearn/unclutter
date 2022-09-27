import ky from "ky-universal";
import { withSentry } from "@sentry/nextjs";

// special handling for potentially large archive fetch
async function handler(req, res) {
    const response = await ky.post(`https://getpocket.com/v3/get`, {
        json: {
            ...req.body,

            state: "all",
            contentType: "article",
            sort: "newest",
            // count: 10,
            // offset: 0,
        },
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "X-Accept": "application/json",
        },
        timeout: 30000,
        retry: 0,
    });
    const { list } = (await response.json()) as any;
    // reduce to used article fields
    const articles = Object.values(list)
        .map(({ resolved_url, time_added, status, favorite }) => ({
            url: resolved_url,
            time_added: parseInt(time_added),
            status: parseInt(status),
            favorite: parseInt(favorite),
        }))
        .reverse();

    // normalize fields to reduce message size
    const importData = {
        urls: articles.map(({ url }) => url),
        time_added: articles.map(({ time_added }) => time_added),
        status: articles.map(({ status }) => status),
        favorite: articles.map(({ favorite }) => favorite),
    };

    res.status(200).json(importData);
}

export default withSentry(handler);
