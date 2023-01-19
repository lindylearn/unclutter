import { indexAnnotationVectors } from "@unclutter/library-components/dist/common/api";
import { Annotation } from "@unclutter/library-components/dist/store";
import { rep, userId } from "./library";

export async function getArticleAnnotations(articleId: string) {
    return await rep.query.listArticleAnnotations(articleId);
}

export async function saveAnnotations(annotations: Annotation[]) {
    const aiAnnotations = annotations?.filter((a) => a.ai_created);
    if (!aiAnnotations || aiAnnotations.length === 0) {
        return;
    }
    console.log(`Saving ${aiAnnotations.length} AI highlights...`);

    await Promise.all(
        aiAnnotations.map(async (annotation) => rep.mutate.putAnnotation(annotation))
    );

    // save embeddings
    await indexAnnotationVectors(
        userId,
        aiAnnotations[0].article_id,
        aiAnnotations.map((a) => a.quote_text),
        aiAnnotations.map((a) => a.id),
        false
    );
}
