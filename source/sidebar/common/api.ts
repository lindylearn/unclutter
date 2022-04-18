import { hypothesisToLindyFormat } from "../../common/annotations/getAnnotations";
import {
    getHypothesisToken,
    getHypothesisUsername,
} from "../../common/annotations/storage";

// const lindyApiUrl = 'http://127.0.0.1:8000';
const lindyApiUrl = "https://api2.lindylearn.io";
const hypothesisApi = "https://api.hypothes.is/api";

// --- global fetching

export async function getAnnotations(url) {
    const [publicAnnotations, userAnnotations] = await Promise.all([
        getLindyAnnotations(url),
        getHypothesisAnnotations(url),
    ]);

    // take from lindy preferrably, otherwise hypothesis
    // -> show replies, upvotes metadata when available, but new annotations immediately
    // edits might take a while to propagate this way
    const seenIds = new Set(publicAnnotations.map((a) => a.id));
    let annotations = publicAnnotations;
    for (const annotation of userAnnotations) {
        if (!seenIds.has(annotation.id)) {
            annotations.push(annotation);
        }
    }

    const username = await getHypothesisUsername();
    annotations = annotations.map((a) => ({
        ...a,
        isMyAnnotation: a.author === username,
    }));

    return annotations;
}

// public annotations via lindy api
async function getLindyAnnotations(url) {
    const response = await fetch(
        `${lindyApiUrl}/annotations?${new URLSearchParams({ page_url: url })}`,
        await _getConfig()
    );
    const json = await response.json();

    return json.results.map((a) => ({ ...a, isPublic: true }));
}

// private annotations directly from hypothesis
async function getHypothesisAnnotations(url) {
    const username = await getHypothesisUsername();
    const response = await fetch(
        `${hypothesisApi}/search?${new URLSearchParams({
            url,
            user: `acct:${username}@hypothes.is`,
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

export async function createAnnotation(pageUrl, localAnnotation) {
    const username = await getHypothesisUsername();
    const response = await fetch(`${hypothesisApi}/annotations`, {
        ...(await _getConfig()),
        method: "POST",
        body: JSON.stringify({
            uri: pageUrl,
            text: localAnnotation.text,
            target: [
                {
                    source: pageUrl,
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

    return json;
}

export async function deleteAnnotation(annotationId) {
    await fetch(`${hypothesisApi}/annotations/${annotationId}`, {
        ...(await _getConfig()),
        method: "DELETE",
    });
}

export async function patchAnnotation(annotation) {
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

export async function upvoteAnnotation(pageUrl, annotationId, isUpvote) {
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
