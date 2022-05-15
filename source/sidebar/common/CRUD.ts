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
    getLindyAnnotations,
    getPersonalHypothesisAnnotations,
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

    const hypothesisSyncEnabled = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );

    const start = performance.now();

    // fetch annotations from configured sources
    const [personalAnnotations, publicAnnotations] = await Promise.all([
        personalAnnotationsEnabled
            ? getPersonalAnnotations(url, hypothesisSyncEnabled)
            : [],
        showSocialAnnotations ? getLindyAnnotations(url) : [],
    ]);

    // take from public lindy API preferrably (to get metadata)
    let annotations = publicAnnotations;
    let hypothesisReplies: LindyAnnotation[] = [];
    const seenIds = new Set(publicAnnotations.map((a) => a.id));
    for (const annotation of personalAnnotations) {
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

    // remove annotations hidden by the user
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
        // mark top-level annotations by the user immutable
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

async function getPersonalAnnotations(
    url: string,
    hypothesisSyncEnabled: boolean
): Promise<LindyAnnotation[]> {
    if (hypothesisSyncEnabled) {
        return await getPersonalHypothesisAnnotations(url);
    } else {
        return await getLocalAnnotations(url);
    }
}

export async function createAnnotation(
    annotation: LindyAnnotation,
    page_title: string
): Promise<LindyAnnotation> {
    const hypothesisSyncEnabled = await getFeatureFlag(
        hypothesisSyncFeatureFlag
    );

    let createdAnnotation: LindyAnnotation;
    if (hypothesisSyncEnabled) {
        createdAnnotation = await createRemoteAnnotation(
            annotation,
            page_title
        );
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
