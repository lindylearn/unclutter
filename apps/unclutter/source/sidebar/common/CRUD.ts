/**
 * Wrapper over local and remote annotation storage, using the one configured by the user.
 */

import { LindyAnnotation } from "../../common/annotations/create";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { getLindyAnnotations } from "./api";
import {
    createLocalAnnotation,
    deleteLocalAnnotation,
    getLocalAnnotations,
    updateLocalAnnotation,
} from "./local";
import { getHiddenAnnotations } from "./legacy";

export async function getAnnotations(
    url: string,
    personalAnnotationsEnabled: boolean,
    enableSocialAnnotations: boolean
): Promise<LindyAnnotation[]> {
    if (!personalAnnotationsEnabled && !enableSocialAnnotations) {
        return [];
    }

    const start = performance.now();

    // fetch annotations from configured sources
    const [personalAnnotations, publicAnnotations] = await Promise.all([
        personalAnnotationsEnabled ? getPersonalAnnotations(url) : [],
        enableSocialAnnotations ? getLindyAnnotations(url) : [],
    ]);

    // filter out public hypothesis annotations
    let annotations = personalAnnotations;
    const seenIds = new Set(personalAnnotations.map((a) => a.id));
    for (const annotation of publicAnnotations) {
        if (!seenIds.has(annotation.id)) {
            annotations.push(annotation);
        }
    }

    // take from public lindy API preferrably (to get metadata)
    // let annotations = publicAnnotations;
    // let hypothesisReplies: LindyAnnotation[] = [];
    // const seenIds = new Set(publicAnnotations.map((a) => a.id));
    // for (const annotation of personalAnnotations) {
    //     if (annotation.reply_to) {
    //         hypothesisReplies.push(annotation);
    //     } else if (!seenIds.has(annotation.id)) {
    //         annotations.push(annotation);
    //     }
    // }
    // populate replies from hypothesis (might be private or not yet propagated)
    // function populateRepliesDfs(current: LindyAnnotation) {
    //     hypothesisReplies
    //         .filter((a) => a.reply_to === current.id)
    //         .filter((a) => !current.replies.some((r) => r.id === a.id))
    //         .map((reply) => {
    //             current.replies.push(reply);
    //             current.reply_count += 1;
    //         });

    //     current.replies.map(populateRepliesDfs);
    // }
    // annotations.map(populateRepliesDfs);

    // remove annotations hidden by the user
    const hiddenAnnotations = await getHiddenAnnotations();
    function hideAnnotationsDfs(current: LindyAnnotation) {
        current.replies = current.replies.filter((r) => !hiddenAnnotations[r.id]);
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
    console.log(`Fetched annotations in ${Math.round(duration)}ms`);

    return annotations;
}

async function getPersonalAnnotations(url: string): Promise<LindyAnnotation[]> {
    return await getLocalAnnotations(url);
}

export async function createAnnotation(
    annotation: LindyAnnotation,
    page_title: string
): Promise<LindyAnnotation> {
    const createdAnnotation = await createLocalAnnotation(annotation);
    reportEventContentScript("createAnnotation");
    return createdAnnotation;
}

export async function updateAnnotation(annotation: LindyAnnotation): Promise<LindyAnnotation> {
    await updateLocalAnnotation(annotation);
    return annotation;
}

export async function deleteAnnotation(annotation: LindyAnnotation): Promise<void> {
    reportEventContentScript("deleteAnnotation");
    return await deleteLocalAnnotation(annotation);
}
