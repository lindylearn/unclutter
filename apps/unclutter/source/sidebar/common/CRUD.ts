import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import {
    LindyAnnotation,
    pickleLocalAnnotation,
    unpickleLocalAnnotation,
} from "../../common/annotations/create";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { getLindyAnnotations } from "./api";
import { getHiddenAnnotations } from "./legacy";
import {
    deleteAnnotationVectors,
    indexAnnotationVectors,
} from "@unclutter/library-components/dist/common/api";
import type { UserInfo } from "@unclutter/library-components/dist/store/_schema";

const rep = new ReplicacheProxy();

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
    let [personalAnnotations, publicAnnotations] = await Promise.all([
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
    const annotations = await rep.query.listArticleAnnotations(articleId);
    return annotations.map(unpickleLocalAnnotation);
}

export async function createAnnotation(
    userInfo: UserInfo,
    annotation: LindyAnnotation
): Promise<LindyAnnotation> {
    await rep.mutate.putAnnotation(pickleLocalAnnotation(annotation));

    // vector already saved in the related fetch
    // TODO do it async again here? but use lindy API.
    // if (userInfo?.aiEnabled) {
    //     indexAnnotationVectors(
    //         userInfo.id,
    //         annotation.article_id,
    //         [annotation.quote_text],
    //         [annotation.id]
    //     );
    // }

    reportEventContentScript("createAnnotation");

    return annotation;
}

export async function updateAnnotation(annotation: LindyAnnotation): Promise<LindyAnnotation> {
    await rep.mutate.updateAnnotation(pickleLocalAnnotation(annotation));
    return annotation;
}

export async function deleteAnnotation(
    userInfo: UserInfo,
    annotation: LindyAnnotation
): Promise<void> {
    await rep.mutate.deleteAnnotation(annotation.id);

    if (userInfo?.aiEnabled) {
        deleteAnnotationVectors(userInfo.id, undefined, annotation.id);
    }

    reportEventContentScript("deleteAnnotation");
}
