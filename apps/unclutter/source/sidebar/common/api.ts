import { hypothesisToLindyFormat, LindyAnnotation } from "../../common/annotations/create";
import { getHypothesisToken, getHypothesisUsername } from "../../common/annotations/storage";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import ky from "ky";
import { Annotation } from "@unclutter/library-components/dist/store";

/**
 * Methods for accessing the remote annotations state (hypothesis and lindy APIs).
 */

// const lindyApiUrl = "http://127.0.0.1:8000";
const lindyApiUrl = "https://api2.lindylearn.io";
const hypothesisApi = "https://api.hypothes.is/api";

// --- global fetching

// public annotations via lindy api
export async function getLindyAnnotations(url: string): Promise<LindyAnnotation[]> {
    // query API with hash of normalized url to not leak visited articles
    const url_hash = getUrlHash(url);

    try {
        const response = await fetch(
            `${lindyApiUrl}/annotations/?${new URLSearchParams({
                page_hash: url_hash,
            })}`,
            await _getConfig()
        );
        const json = await response.json();

        const username = await getHypothesisUsername();
        function mapFormat(annotation: LindyAnnotation): LindyAnnotation {
            return {
                ...annotation,
                isPublic: true,

                url,
                replies: annotation.replies.map(mapFormat),
                isMyAnnotation: annotation.author === username,
            };
        }
        return json.results.map(mapFormat);
    } catch (err) {
        console.error(err);
        return [];
    }
}

// private annotations directly from hypothesis
export async function getPersonalHypothesisAnnotations(url: string): Promise<LindyAnnotation[]> {
    const username = await getHypothesisUsername();
    const response = await fetch(
        `${hypothesisApi}/search?${new URLSearchParams({
            url,
            user: `acct:${username}@hypothes.is`,
            limit: "50",
        })}`,
        await _getConfig()
    );
    const json = await response.json();

    // this includes replies at the top level
    return json.rows.map((a) => hypothesisToLindyFormat(a, username));
}

export async function getPageHistory(url) {
    const response = await fetch(
        `${lindyApiUrl}/annotations/get_page_history?${new URLSearchParams({
            page_url: url,
        })}`,
        await _getConfig()
    );
    const json = await response.json();

    return json;
}

// from https://github.com/lindylearn/obsidian-annotations/blob/master/src/api/api.ts
export async function getHypothesisAnnotationsSince(
    lastSyncDate?: Date,
    limit = 5000
): Promise<LindyAnnotation[]> {
    const username = await getHypothesisUsername();
    let annotations = [];

    try {
        // Paginate API calls via search_after param
        // search_after=null starts with the earliest annotations
        let newestTimestamp = lastSyncDate?.toUTCString() || "1970-01-01";
        while (annotations.length < limit) {
            const response: any = await ky
                .get(`${hypothesisApi}/search`, {
                    ...(await _getConfig()),
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

    return annotations.map((a) => hypothesisToLindyFormat(a, username));
}

// --- user actions

export async function createRemoteAnnotation(
    localAnnotation: Annotation,
    page_url: string,
    page_title: string
): Promise<string> {
    const username = await getHypothesisUsername();
    const response = await fetch(`${hypothesisApi}/annotations`, {
        ...(await _getConfig()),
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

export async function deleteRemoteAnnotation(annotation: Annotation): Promise<void> {
    await fetch(`${hypothesisApi}/annotations/${annotation.h_id}`, {
        ...(await _getConfig()),
        method: "DELETE",
    });
}

export async function updateRemoteAnnotation(annotation: Annotation): Promise<void> {
    const username = await getHypothesisUsername();
    const response = await fetch(`${hypothesisApi}/annotations/${annotation.h_id}`, {
        ...(await _getConfig()),
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

export async function upvoteRemoteAnnotation(pageUrl, annotationId, isUpvote) {
    await fetch(`${lindyApiUrl}/annotations/upvote`, {
        ...(await _getConfig()),
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            annotation_id: annotationId,
            is_unvote: !isUpvote,
        }),
    });
}

export async function hideRemoteAnnotation(annotation: LindyAnnotation): Promise<void> {
    await fetch(`${lindyApiUrl}/annotations/hide`, {
        ...(await _getConfig()),
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            annotation_id: annotation.id,
        }),
    });
}

async function _getConfig() {
    const apiToken = await getHypothesisToken();

    if (apiToken) {
        return {
            headers: { Authorization: `Bearer ${apiToken}` },
        };
    }
    return {};
}
