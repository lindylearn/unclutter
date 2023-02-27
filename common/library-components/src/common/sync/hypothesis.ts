import ky from "ky-universal";
import type { Annotation, Article } from "../../store";
import { getUrlHash } from "../url";
import { constructLocalArticle } from "../util";

const hypothesisApi = "https://api.hypothes.is/api";

// from https://github.com/lindylearn/obsidian-annotations/blob/master/src/api/api.ts
export async function getHypothesisAnnotationsSince(
    username: string,
    apiToken: string,
    lastSyncDate?: Date,
    limit = 5000
): Promise<[Annotation[], Article[], string]> {
    let hypothesisAnnotations: any[] = [];

    let newestTimestamp = lastSyncDate?.toUTCString() || "1970-01-01";
    try {
        // Paginate API calls via search_after param
        // search_after=null starts with the earliest annotations
        while (hypothesisAnnotations.length < limit) {
            const response: any = await ky
                .get(`${hypothesisApi}/search`, {
                    headers: { Authorization: `Bearer ${apiToken}` },
                    searchParams: {
                        limit: 200, // Max pagination size
                        sort: "updated",
                        order: "asc", // Get all annotations since search_after
                        search_after: newestTimestamp,
                        user: `acct:${username}@hypothes.is`,
                    },
                })
                .json();
            const newAnnotations = response.rows;
            if (!newAnnotations.length) {
                // No more annotations
                break;
            }

            hypothesisAnnotations.push(...newAnnotations);
            newestTimestamp = newAnnotations[newAnnotations.length - 1].updated;
        }
    } catch (e) {
        console.error(e);
    }

    const annotations = hypothesisAnnotations.map(parseHypothesisAnnotation);

    const articles: Article[] = [];
    const seenArticleIds = new Set();
    for (let i = 0; i < annotations.length; i++) {
        const annotation = annotations[i];
        const hypothesisAnnotation = hypothesisAnnotations[i];

        if (!seenArticleIds.has(annotation.article_id)) {
            seenArticleIds.add(annotation.article_id);
            articles.push({
                ...constructLocalArticle(
                    hypothesisAnnotation.uri,
                    annotation.article_id,
                    hypothesisAnnotation.document.title?.[0]
                ),
                reading_progress: 1,
            });
        }
    }

    return [annotations, articles, newestTimestamp];
}

export function parseHypothesisAnnotation(annotation: any): Annotation {
    const article_id = getUrlHash(annotation.uri);

    return {
        id: annotation.id,
        h_id: annotation.id,
        article_id,
        created_at: Math.round(new Date(annotation.created).getTime() / 1000),
        updated_at: annotation.updated
            ? Math.round(new Date(annotation.updated).getTime() / 1000)
            : undefined,
        quote_text: annotation.target?.[0].selector?.filter((s) => s.type == "TextQuoteSelector")[0]
            .exact,
        text: annotation.text,
        tags: annotation.tags,
        quote_html_selector: annotation.target[0].selector,
    };
}

export async function createHypothesisAnnotation(
    username: string,
    apiToken: string,
    localAnnotation: Annotation,
    page_url: string,
    page_title: string
): Promise<string> {
    const response = await fetch(`${hypothesisApi}/annotations`, {
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

export async function deleteHypothesisAnnotation(
    username: string,
    apiToken: string,
    annotation: Annotation
): Promise<void> {
    await fetch(`${hypothesisApi}/annotations/${annotation.h_id}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
        method: "DELETE",
    });
}

export async function updateHypothesisAnnotation(
    username: string,
    apiToken: string,
    annotation: Annotation
): Promise<void> {
    const response = await fetch(`${hypothesisApi}/annotations/${annotation.h_id}`, {
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

export async function getHypothesisUsername(apiToken: string): Promise<string | null> {
    try {
        const response = await fetch(`https://api.hypothes.is/api/profile`, {
            headers: {
                Authorization: `Bearer ${apiToken}`,
            },
        });
        const json = await response.json();
        const fullUserId = json.userid; // e.g. acct:remikalir@hypothes.is
        return fullUserId.match(/([^:]+)@/)[1];
    } catch {
        return null;
    }
}
