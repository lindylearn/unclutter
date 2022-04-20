import { LindyAnnotation } from "source/common/annotations/create";
import browser from "../../common/polyfill";

/**
 * The local annotations state is only used if the hypothesis sync isn't enabled (yet).
 */

export async function getLocalAnnotations(
    pageUrl: string
): Promise<LindyAnnotation[]> {
    const storage = await _getAnnotationsStorage();
    if (!storage?.[pageUrl]) {
        return [];
    }

    return Object.values(storage[pageUrl]);
}

export async function createLocalAnnotation(
    annotation: LindyAnnotation
): Promise<LindyAnnotation> {
    const storage = await _getAnnotationsStorage();
    if (!storage[annotation.url]) {
        storage[annotation.url] = {};
    }

    storage[annotation.url][annotation.id] = annotation;

    await _setAnnotationsStorage(storage);

    return annotation;
}

export async function updateLocalAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    const storage = await _getAnnotationsStorage();

    storage[annotation.url][annotation.id] = annotation;

    await _setAnnotationsStorage(storage);
}

export async function deleteLocalAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    const storage = await _getAnnotationsStorage();

    delete storage[annotation.url][annotation.id];

    await _setAnnotationsStorage(storage);
}

async function _getAnnotationsStorage(): Promise<{
    [pageUrl: string]: { [annotationId: string]: LindyAnnotation };
}> {
    const result = await browser.storage.sync.get("local-user-annotations");
    return result["local-user-annotations"] || {};
}

async function _setAnnotationsStorage(storage: {
    [pageUrl: string]: { [annotationId: string]: LindyAnnotation };
}): Promise<void> {
    await browser.storage.sync.set({
        "local-user-annotations": storage,
    });
}
