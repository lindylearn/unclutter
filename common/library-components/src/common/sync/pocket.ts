import { subYears } from "date-fns";
import ky from "ky-universal";
import type { Annotation, Article } from "../../store";
import { getUrlHash } from "../url";
import { constructLocalArticle } from "../util";

// const apiHost = "https://my.lindylearn.io";
const apiHost = "http://localhost:3000";

export const pocketConsumerKey = "103045-348c15882b98fde8379db28";

export async function getPocketArticles(
    apiToken: string,
    lastSyncDate?: Date
): Promise<Article[] | null> {
    try {
        // see https://getpocket.com/developer/docs/v3/retrieve
        // proxy via api function to avoid CORS and other issues
        const pocketArticles = (await ky
            .post(`${apiHost}/api/pocket/get`, {
                json: {
                    consumer_key: pocketConsumerKey,
                    access_token: apiToken,
                    since: lastSyncDate?.getTime() || 0,
                },
                timeout: false,
                retry: 0,
            })
            .json()) as any[];

        console.log(pocketArticles);

        const startTimeMillis = subYears(new Date(), 1).getTime();
        const articles: Article[] = pocketArticles
            // filter very large libraries
            // include all from last year plus favorited and read articles
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
                    ...constructLocalArticle(
                        resolved_url,
                        getUrlHash(resolved_url),
                        resolved_title
                    ),
                    pocket_id: item_id,
                    time_added: parseInt(time_added),
                    is_favorite: favorite === "1",
                    reading_progress: status === "1" ? 1 : 0,
                    word_count: word_count || 0,
                })
            );

        console.log(articles);

        return articles;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function addPocketArticle(
    username: string,
    apiToken: string,
    localAnnotation: Annotation,
    page_url: string,
    page_title: string
): Promise<string> {
    const response = await fetch(`${apiHost}/annotations`, {
        headers: { Authorization: `Bearer ${apiToken}` },
        method: "POST",
        body: JSON.stringify({
            uri: page_url,
            text: localAnnotation.text,
            target: [
                {
                    source: page_url,
                    ...(localAnnotation.quote_html_selector
                        ? {
                              selector: localAnnotation.quote_html_selector,
                          }
                        : {}),
                },
            ],
            document: {
                title: [page_title],
            },
            tags: localAnnotation.tags,
            permissions: {
                read: [false ? "group:__world__" : `acct:${username}@hypothes.is`],
            },
            references: [], // localAnnotation.reply_to ? [localAnnotation.reply_to] : [],
        }),
    });
    const json = await response.json();
    return json.id;
}

export async function deletePocketArticle(
    username: string,
    apiToken: string,
    annotation: Annotation
): Promise<void> {
    await fetch(`${apiHost}/annotations/${annotation.h_id}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
        method: "DELETE",
    });
}

export async function updatePocketArticle(
    username: string,
    apiToken: string,
    annotation: Annotation
): Promise<void> {
    const response = await fetch(`${apiHost}/annotations/${annotation.h_id}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
        method: "PATCH",
        body: JSON.stringify({
            text: annotation.text,
            tags: annotation.tags,
            permissions: {
                read: [false ? "group:__world__" : `acct:${username}@hypothes.is`],
            },
        }),
    });
    // const json = await response.json();
    // return json;
}
