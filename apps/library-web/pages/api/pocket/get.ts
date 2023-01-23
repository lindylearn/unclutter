import ky from "ky-universal";
import { withSentry } from "@sentry/nextjs";
import { subYears } from "date-fns";

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

    const startTimeMillis = subYears(new Date(), 1).getTime();
    const articles = Object.values(list)
        // filter very large libraries
        // include all from last year plus favorited and read articles
        .filter(
            ({ time_updated, time_to_read, favorite, status }) =>
                parseInt(time_updated) * 1000 >= startTimeMillis ||
                favorite === "1" ||
                status === "1"
        )
        // reduce to used article fields
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
