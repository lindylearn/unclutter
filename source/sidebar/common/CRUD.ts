/**
 * Wrapper over local and remote annotation storage, using the one configured by the user.
 */

import { LindyAnnotation } from "../../common/annotations/create";
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
    getHiddenAnnotations,
    getLocalAnnotations,
    updateLocalAnnotation,
} from "./local";

export async function getAnnotations(
    url: string,
    personalAnnotationsEnabled: boolean,
    showSocialAnnotations: boolean
): Promise<LindyAnnotation[]> {
    if (!personalAnnotationsEnabled && !showSocialAnnotations) {
        return [];
    }

    const start = performance.now();

    // *** fetch annotations from configured sources ***
    let localAnnotations: LindyAnnotation[] = [];
    let userRemoteAnnotations: LindyAnnotation[] = [];
    let publicAnnotations: LindyAnnotation[] = [];

    const hypothesisSyncEnabled = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );

    if (personalAnnotationsEnabled) {
        if (hypothesisSyncEnabled) {
            userRemoteAnnotations = await getHypothesisAnnotations(url);
        } else {
            localAnnotations = await getLocalAnnotations(url);
        }
    }
    if (showSocialAnnotations) {
        publicAnnotations = await getLindyAnnotations(url);
    }

    // *** reconcile lists ***

    // take from lindy preferrably, otherwise hypothesis
    // -> show replies, upvotes metadata when available, but new & private annotations immediately
    let annotations = localAnnotations.concat(publicAnnotations);
    let hypothesisReplies: LindyAnnotation[] = [];
    const seenIds = new Set(publicAnnotations.map((a) => a.id));
    for (const annotation of userRemoteAnnotations) {
        if (annotation.reply_to) {
            hypothesisReplies.push(annotation);
        } else if (!seenIds.has(annotation.id)) {
            annotations.push(annotation);
        }
    }

    // populate replies from hypothesis (might be private or not yet propagated)
    function populateRepliesDfs(current: LindyAnnotation) {
        hypothesisReplies
            .filter((a) => a.reply_to === current.id)
            .filter((a) => !current.replies.some((r) => r.id === a.id))
            .map((reply) => {
                current.replies.push(reply);
                current.reply_count += 1;
            });

        current.replies.map(populateRepliesDfs);
    }
    annotations.map(populateRepliesDfs);

    // remove annotations hidden by the user (saved locally)
    const hiddenAnnotations = await getHiddenAnnotations();
    function hideAnnotationsDfs(current: LindyAnnotation) {
        current.replies = current.replies.filter(
            (r) => !hiddenAnnotations[r.id]
        );
        current.replies.map(hideAnnotationsDfs);
    }
    annotations = annotations.filter((a) => !hiddenAnnotations[a.id]);
    annotations.map(hideAnnotationsDfs);

    if (!personalAnnotationsEnabled) {
        // mark social annotations by the user immutable
        annotations = annotations.map((a) => {
            a.isMyAnnotation = false;
            return a;
        });
    }

    const duration = performance.now() - start;
    console.log(
        `Fetched annotations (${
            personalAnnotationsEnabled
                ? hypothesisSyncEnabled
                    ? "hypothesis, "
                    : "local, "
                : ""
        }${showSocialAnnotations ? "lindy" : ""}) in ${Math.round(duration)}ms`
    );

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
