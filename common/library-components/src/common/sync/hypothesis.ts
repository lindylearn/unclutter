import ky from "ky-universal";
import { Annotation } from "../../store";
import { getUrlHash } from "../url";
import { constructLocalArticle } from "../util";

const hypothesisApi = "https://api.hypothes.is/api";

type LindyAnnotation = any;
// only used when importing from hypothesis
// TODO serialize to Annotation type directly
export function hypothesisToLindyFormat(annotation: any, currentUsername: string): LindyAnnotation {
    const article_id = getUrlHash(annotation.uri);
    const author: string = annotation.user.match(/([^:]+)@/)[1];
    return {
        id: annotation.id,
        h_id: annotation.id,
        article_id,
        author,
        isMyAnnotation: author === currentUsername,
        platform: "h",
        link: `https://hypothes.is/a/${annotation.id}`,
        created_at: annotation.created,
        updated_at: annotation.updated,
        reply_count: 0,
        quote_text: annotation.target?.[0].selector?.filter((s) => s.type == "TextQuoteSelector")[0]
            .exact,
        text: annotation.text,
        replies: [],
        upvote_count: 0,
        tags: annotation.tags,
        quote_html_selector: annotation.target[0].selector,
        user_upvoted: false,
        isPublic: annotation.permissions.read[0] === "group:__world__",
        reply_to: annotation.references?.[annotation.references.length - 1],

        article: constructLocalArticle(annotation.uri, article_id, annotation.document.title?.[0]),
    };
}

// from https://github.com/lindylearn/obsidian-annotations/blob/master/src/api/api.ts
export async function getHypothesisAnnotationsSince(
    username: string,
    apiToken: string,
    lastSyncDate?: Date,
    limit = 5000
): Promise<[LindyAnnotation[], string]> {
    let annotations: LindyAnnotation[] = [];

    let newestTimestamp = lastSyncDate?.toUTCString() || "1970-01-01";
    try {
        // Paginate API calls via search_after param
        // search_after=null starts with the earliest annotations
        while (annotations.length < limit) {
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

            annotations = [...annotations, ...newAnnotations];
            newestTimestamp = newAnnotations[newAnnotations.length - 1].updated;
        }
    } catch (e) {
        console.error(e);
    }

    return [annotations.map((a) => hypothesisToLindyFormat(a, username)), newestTimestamp];
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
