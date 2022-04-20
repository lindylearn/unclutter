import {
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
} from "source/common/featureFlags";
import { hypothesisToLindyFormat } from "../../common/annotations/create";
import {
    getHypothesisToken,
    getHypothesisUsername,
} from "../../common/annotations/storage";

// const lindyApiUrl = 'http://127.0.0.1:8000';
const lindyApiUrl = "https://api2.lindylearn.io";
const hypothesisApi = "https://api.hypothes.is/api";

// --- global fetching

export async function getAnnotations(
    url: string,
    showSocialAnnotations: boolean
) {
    // *** fetch annotations from configured sources ***
    let localAnnotations = [];
    let userRemoteAnnotations = [];
    let publicAnnotations = [];

    // TODO fetch from local storage
    const fetchPersonalHypothesis = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );
    console.log(
        `Fetching annotations (local, ${
            fetchPersonalHypothesis ? "remote, " : ""
        }${showSocialAnnotations ? "public" : ""})`
    );
    if (fetchPersonalHypothesis) {
        userRemoteAnnotations = await getHypothesisAnnotations(url);
    }
    if (showSocialAnnotations) {
        publicAnnotations = await getLindyAnnotations(url);
    }

    // *** reconcile lists ***

    // take from lindy preferrably, otherwise hypothesis
    // -> show replies, upvotes metadata when available, but new annotations immediately
    // edits might take a while to propagate this way
    let annotations = localAnnotations.concat(publicAnnotations);

    const seenIds = new Set(publicAnnotations.map((a) => a.id));
    for (const annotation of userRemoteAnnotations) {
        if (!seenIds.has(annotation.id)) {
            annotations.push(annotation);
        }
    }

    // add isMyAnnotation for hypothesis annotations
    const username = await getHypothesisUsername();
    if (username) {
        annotations = annotations.map((a) => {
            if (a.platform === "h") {
                return {
                    ...a,
                    isMyAnnotation: a.author === username,
                };
            } else {
                return a;
            }
        });
    }

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
