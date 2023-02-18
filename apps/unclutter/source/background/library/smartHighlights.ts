import {
    fetchRelatedAnnotations,
    indexAnnotationVectors,
} from "@unclutter/library-components/dist/common/api";
import { Annotation, UserInfo } from "@unclutter/library-components/dist/store";
import { rep } from "./library";

export async function saveAIAnnotations(userInfo: UserInfo, annotations: Annotation[]) {
    if (!userInfo || !annotations?.length) {
        return;
    }
    console.log(`Saving ${annotations.length} AI highlights...`);

    await Promise.all(annotations.map(async (annotation) => rep.mutate.putAnnotation(annotation)));

    // save embeddings
    await indexAnnotationVectors(
        userInfo.id,
        annotations[0].article_id,
        annotations.map((a) => a.quote_text),
        annotations.map((a) => a.id),
        false
    );
}

export async function getRelatedAnnotationsCount(
    userInfo: UserInfo,
    annotations: Annotation[]
): Promise<number> {
    if (!userInfo || !annotations?.length) {
        return;
    }

    // disabled for now
    return 0;

    // fetch user highlights that are related to the found article annotations
    const relatedPerAnnotation = await fetchRelatedAnnotations(
        userInfo.id,
        annotations[0].article_id,
        annotations.map((a) => a.quote_text)
    );
    if (!relatedPerAnnotation?.length) {
        return 0;
    }

    let relatedCount = 0;
    relatedPerAnnotation.forEach((related) => {
        relatedCount += related.length;
    });
    console.log(`Found ${relatedCount} related highlights...`);

    return relatedCount;
}
