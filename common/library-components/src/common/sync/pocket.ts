import { subYears } from "date-fns";
import ky from "ky-universal";
import { Annotation, Article, readingProgressFullClamp } from "../../store";
import { getUrlHash } from "../url";
import { constructLocalArticle } from "../util";

// const apiHost = "https://my.lindylearn.io";
const apiHost = "http://localhost:3000";

export const pocketConsumerKey = "106099-bc04e91092ca30bacd08f96";

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
                    since: Math.round((lastSyncDate?.getTime() || 0) / 1000),
                },
                timeout: false,
                retry: 0,
            })
            .json()) as any[];

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
                    word_count: parseInt(word_count) || 0,
                })
            );

        return articles;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function addUpdateArticles(apiToken: string, articles: Article[]): Promise<string[]> {
    // send actions in batch to pass time_added
    // see https://getpocket.com/developer/docs/v3/modify
    const actions: any[] = [];
    articles.forEach((article) => {
        if (article.pocket_id) {
            // already exists remotely
            const isArchived = article.reading_progress >= readingProgressFullClamp;
            actions.push({
                action: isArchived ? "archive" : "readd",
                item_id: article.pocket_id,
                time: article.time_updated?.toString(),
            });
        } else {
            actions.push({
                action: "add",
                url: article.url,
                title: article.title,
                time: article.time_added?.toString(),
            });
        }
    });

    const response: any = (await ky
        .post(`${apiHost}/api/pocket/send`, {
            json: {
                consumer_key: pocketConsumerKey,
                access_token: apiToken,
                actions,
            },
            timeout: false,
            retry: 0,
        })
        .json()) as any[];

    return response.action_results.map((result: any, i: number) => result?.item_id || undefined);
}

export async function deletePocketArticle(apiToken: string, article: Article): Promise<void> {
    await ky.post(`${apiHost}/api/pocket/send`, {
        json: {
            consumer_key: pocketConsumerKey,
            access_token: apiToken,
            actions: [
                {
                    action: "delete",
                    item_id: article.pocket_id,
                },
            ],
        },
    });
}
