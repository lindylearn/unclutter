import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import { ReplicacheProxy } from "@unclutter/library-components/dist/common/messaging";
import {
    LindyAnnotation,
    pickleLocalAnnotation,
    unpickleLocalAnnotation,
} from "../../common/annotations/create";

const rep = new ReplicacheProxy();

export async function getLocalAnnotations(pageUrl: string): Promise<LindyAnnotation[]> {
    const annotations = await rep.query.listArticleAnnotations(getUrlHash(pageUrl));
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
