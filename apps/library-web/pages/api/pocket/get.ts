import ky from "ky-universal";
import { subYears } from "date-fns";
import { withSentry } from "@sentry/nextjs";
import type { Article } from "@unclutter/library-components/dist/store";

import { handleCors } from "../../../common/cors";
import { constructLocalArticle, getUrlHash } from "@unclutter/library-components/dist/common";

// special handling for potentially large archive fetch
async function handler(req, res) {
    if (handleCors(req, res)) {
        return;
    }

    const response = await ky.post(`https://getpocket.com/v3/get`, {
        json: {
            ...req.body,
            state: "all",
            contentType: "article",
            sort: "newest",
        },
        headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "X-Accept": "application/json",
        },
        timeout: 30000,
        retry: 0,
    });
    const { list } = (await response.json()) as any;

    const startTimeMillis = subYears(new Date(), 2).getTime();
    const articles: Article[] = (Object.values(list) as any[])
        // filter very large libraries
        // include all from last 2 years plus favorited and read articles
        .filter(
            ({ time_updated, favorite, status }) =>
                parseInt(time_updated) * 1000 >= startTimeMillis ||
                favorite === "1" ||
                status === "1"
        )
        // filter out non-articles
        .filter(({ resolved_url }) => !(new URL(resolved_url).pathname === "/"))
        // map format
        .map(
            ({
                item_id,
                resolved_url,
                resolved_title,
                time_added,
                status,
                favorite,
                word_count,
            }) => ({
                ...constructLocalArticle(resolved_url, getUrlHash(resolved_url), resolved_title),
                pocket_id: item_id,
                time_added: parseInt(time_added),
                is_favorite: favorite === "1",
                reading_progress: status === "1" ? 1 : 0,
                word_count: parseInt(word_count) || 0,
            })
        );

    res.status(200).json(articles);
}

export default withSentry(handler);
