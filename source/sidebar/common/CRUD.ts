/**
 * Wrapper over local and remote annotation storage, using the one configured by the user.
 */

import { LindyAnnotation } from "../../common/annotations/create";
import { getHypothesisUsername } from "../../common/annotations/storage";
import {
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
} from "../../common/featureFlags";
import { reportEventContentScript } from "../../content-script/messaging";
import {
    createRemoteAnnotation,
    deleteRemoteAnnotation,
    getHypothesisAnnotations,
    getLindyAnnotations,
    updateRemoteAnnotation,
} from "./api";
import {
    createLocalAnnotation,
    deleteLocalAnnotation,
    getLocalAnnotations,
    updateLocalAnnotation,
} from "./local";

export async function getAnnotations(
    url: string,
    showSocialAnnotations: boolean
): Promise<LindyAnnotation[]> {
    // *** fetch annotations from configured sources ***
    let localAnnotations = [];
    let userRemoteAnnotations = [];
    let publicAnnotations = [];

    // TODO fetch from local storage
    const hypothesisSyncEnabled = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );
    console.log(
        `Fetching annotations (local, ${
            hypothesisSyncEnabled ? "remote, " : ""
        }${showSocialAnnotations ? "public" : ""})`
    );
    if (hypothesisSyncEnabled) {
        userRemoteAnnotations = await getHypothesisAnnotations(url);
    } else {
        localAnnotations = await getLocalAnnotations(url);
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

export async function createAnnotation(
    annotation: LindyAnnotation
): Promise<LindyAnnotation> {
    const hypothesisSyncEnabled = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );

    let createdAnnotation: LindyAnnotation;
    if (hypothesisSyncEnabled) {
        createdAnnotation = await createRemoteAnnotation(annotation);
    } else {
        createdAnnotation = await createLocalAnnotation(annotation);
    }

    reportEventContentScript("createAnnotation", { hypothesisSyncEnabled });

    return createdAnnotation;
}

export async function updateAnnotation(
    annotation: LindyAnnotation
): Promise<LindyAnnotation> {
    const hypothesisSyncEnabled = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );

    if (hypothesisSyncEnabled) {
        await updateRemoteAnnotation(annotation);
    } else {
        await updateLocalAnnotation(annotation);
    }

    return annotation;
}

export async function deleteAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    const hypothesisSyncEnabled = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );

    if (hypothesisSyncEnabled) {
        return await deleteRemoteAnnotation(annotation);
    } else {
        return await deleteLocalAnnotation(annotation);
    }
}
