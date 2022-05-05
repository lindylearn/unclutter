import {
    hypothesisToLindyFormat,
    LindyAnnotation,
} from "../../common/annotations/create";
import {
    getHypothesisToken,
    getHypothesisUsername,
} from "../../common/annotations/storage";

/**
 * Methods for accessing the remote annotations state (hypothesis and lindy APIs).
 */

// const lindyApiUrl = 'http://127.0.0.1:8000';
const lindyApiUrl = "https://api2.lindylearn.io";
const hypothesisApi = "https://api.hypothes.is/api";

// --- global fetching

// public annotations via lindy api
export async function getLindyAnnotations(url) {
    const response = await fetch(
        `${lindyApiUrl}/annotations?${new URLSearchParams({ page_url: url })}`,
        await _getConfig()
    );
    const json = await response.json();

    return json.results.map((a) => ({ ...a, isPublic: true }));
}

// private annotations directly from hypothesis
export async function getHypothesisAnnotations(url) {
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

    return json.rows
        .filter((a) => !a.references || a.references.length === 0)
        .map(hypothesisToLindyFormat);
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
    localAnnotation: LindyAnnotation
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
                    selector: localAnnotation.quote_html_selector,
                },
            ],
            tags: localAnnotation.tags,
            permissions: {
                read: [
                    localAnnotation.isPublic
                        ? "group:__world__"
                        : `acct:${username}@hypothes.is`,
                ],
            },
        }),
    });
    const json = await response.json();

    return {
        ...hypothesisToLindyFormat(json),
        displayOffset: localAnnotation.displayOffset,
        localId: localAnnotation.localId,
        isMyAnnotation: true,
    };
}

export async function deleteRemoteAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    await fetch(`${hypothesisApi}/annotations/${annotation.id}`, {
        ...(await _getConfig()),
        method: "DELETE",
    });
}

export async function updateRemoteAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    const username = await getHypothesisUsername();
    const response = await fetch(
        `${hypothesisApi}/annotations/${annotation.id}`,
        {
            ...(await _getConfig()),
            method: "PATCH",
            body: JSON.stringify({
                text: annotation.text,
                tags: annotation.tags,
                permissions: {
                    read: [
                        annotation.isPublic
                            ? "group:__world__"
                            : `acct:${username}@hypothes.is`,
                    ],
                },
            }),
        }
    );
    const json = await response.json();

    return json;
}

export async function upvoteRemoteAnnotation(pageUrl, annotationId, isUpvote) {
    await fetch(`${lindyApiUrl}/annotations/upvote`, {
        ...(await _getConfig()),
        method: "POST",
        body: JSON.stringify({
            annotation_id: annotationId,
            is_unvote: !isUpvote,
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
