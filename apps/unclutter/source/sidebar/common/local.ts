import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import {
    LindyAnnotation,
    pickleLocalAnnotation,
    unpickleLocalAnnotation,
} from "../../common/annotations/create";

const rep = new ReplicacheProxy();

export async function getLocalAnnotations(articleId: string): Promise<LindyAnnotation[]> {
    const annotations = await rep.query.listArticleAnnotations(articleId);
    return annotations.map(unpickleLocalAnnotation);
}

export async function createLocalAnnotation(annotation: LindyAnnotation): Promise<LindyAnnotation> {
    await rep.mutate.putAnnotation(pickleLocalAnnotation(annotation));
    return annotation;
}

export async function updateLocalAnnotation(annotation: LindyAnnotation): Promise<void> {
    await rep.mutate.updateAnnotation(pickleLocalAnnotation(annotation));
}

export async function deleteLocalAnnotation(annotation: LindyAnnotation): Promise<void> {
    await rep.mutate.deleteAnnotation(annotation.id);
}
