import { hypothesisToLindyFormat, LindyAnnotation } from "../../common/annotations/create";
import { getHypothesisToken, getHypothesisUsername } from "../../common/annotations/storage";
import { getUrlHash } from "@unclutter/library-components/dist/common/url";

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
                localId: annotation.id,
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

// --- user actions

export async function createRemoteAnnotation(
    localAnnotation: LindyAnnotation,
    page_title: string
): Promise<LindyAnnotation> {
    const username = await getHypothesisUsername();
    const response = await fetch(`${hypothesisApi}/annotations`, {
        ...(await _getConfig()),
        method: "POST",
        body: JSON.stringify({
            uri: localAnnotation.url,
            text: localAnnotation.text,
            target: [
                {
                    source: localAnnotation.url,
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
                read: [
                    localAnnotation.isPublic ? "group:__world__" : `acct:${username}@hypothes.is`,
                ],
            },
            references: localAnnotation.reply_to ? [localAnnotation.reply_to] : [],
        }),
    });
    const json = await response.json();

    return {
        ...hypothesisToLindyFormat(json, username),
        displayOffset: localAnnotation.displayOffset,
        displayOffsetEnd: localAnnotation.displayOffsetEnd,
        localId: localAnnotation.localId,
        focused: localAnnotation.focused,
    };
}

export async function deleteRemoteAnnotation(annotation: LindyAnnotation): Promise<void> {
    await fetch(`${hypothesisApi}/annotations/${annotation.id}`, {
        ...(await _getConfig()),
        method: "DELETE",
    });
}

export async function updateRemoteAnnotation(annotation: LindyAnnotation): Promise<void> {
    const username = await getHypothesisUsername();
    const response = await fetch(`${hypothesisApi}/annotations/${annotation.id}`, {
        ...(await _getConfig()),
        method: "PATCH",
        body: JSON.stringify({
            text: annotation.text,
            tags: annotation.tags,
            permissions: {
                read: [annotation.isPublic ? "group:__world__" : `acct:${username}@hypothes.is`],
            },
        }),
    });
    const json = await response.json();

    return json;
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
