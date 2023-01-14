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
import { indexAnnotationVectors } from "../../common/api";

export async function getAnnotations(
    articleId: string,
    personalAnnotationsEnabled: boolean,
    enableSocialAnnotations: boolean
): Promise<LindyAnnotation[]> {
    if (!personalAnnotationsEnabled && !enableSocialAnnotations) {
        return [];
    }

    const start = performance.now();

    // fetch annotations from configured sources
    const [personalAnnotations, publicAnnotations] = await Promise.all([
        personalAnnotationsEnabled ? getPersonalAnnotations(articleId) : [],
        enableSocialAnnotations ? getLindyAnnotations(articleId) : [],
    ]);

    // filter out public hypothesis annotations
    let annotations = personalAnnotations;
    const seenIds = new Set(personalAnnotations.map((a) => a.id));
    for (const annotation of publicAnnotations) {
        if (!seenIds.has(annotation.id) && annotation.text) {
            annotations.push({
                ...annotation,
                isMyAnnotation: false,
            });
        }
    }

    // remove annotations hidden by the user
    const hiddenAnnotations = await getHiddenAnnotations();
    function hideAnnotationsDfs(current: LindyAnnotation) {
        current.replies = current.replies.filter((r) => !hiddenAnnotations[r.id]);
        current.replies.map(hideAnnotationsDfs);
    }
    annotations = annotations.filter((a) => !hiddenAnnotations[a.id]);
    annotations.map(hideAnnotationsDfs);

    const duration = performance.now() - start;
    console.log(`Fetched annotations in ${Math.round(duration)}ms`);

    return annotations;
}

async function getPersonalAnnotations(articleId: string): Promise<LindyAnnotation[]> {
    return await getLocalAnnotations(articleId);
}

export async function createAnnotation(annotation: LindyAnnotation): Promise<LindyAnnotation> {
    const createdAnnotation = await createLocalAnnotation(annotation);
    reportEventContentScript("createAnnotation");

    // indexAnnotationVectors("test", )

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
