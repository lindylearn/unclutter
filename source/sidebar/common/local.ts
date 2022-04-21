import { LindyAnnotation } from "../../common/annotations/create";
import browser from "../../common/polyfill";

/**
 * The local annotations state is only used if the hypothesis sync isn't enabled (yet).
 */

export async function getLocalAnnotations(
    pageUrl: string
): Promise<LindyAnnotation[]> {
    const storage = await _getPageStorage(pageUrl);

    return Object.values(storage);
}

export async function createLocalAnnotation(
    annotation: LindyAnnotation
): Promise<LindyAnnotation> {
    const storage = await _getPageStorage(annotation.url);

    storage[annotation.id] = annotation;

    await _setPageStorage(annotation.url, storage);

    return annotation;
}

export async function updateLocalAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    const storage = await _getPageStorage(annotation.url);

    storage[annotation.id] = annotation;

    await _setPageStorage(annotation.url, storage);
}

export async function deleteLocalAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    const storage = await _getPageStorage(annotation.url);

    delete storage[annotation.id];

    await _setPageStorage(annotation.url, storage);
}

export async function getAllLocalAnnotations(): Promise<LindyAnnotation[]> {
    const allStorage = await browser.storage.sync.get(null);

    const allAnnotations: LindyAnnotation[] = Object.keys(allStorage)
        .filter((pageKey) => pageKey.startsWith("local-annotations_"))
        .reduce(
            (list, pageKey) => [...list, ...Object.values(allStorage[pageKey])],
            []
        );

    return allAnnotations;
}

export async function deleteAllLocalAnnotations(): Promise<void> {
    const allStorage = await browser.storage.sync.get(null);

    const allKeys = Object.keys(allStorage).filter((pageKey) =>
        pageKey.startsWith("local-annotations_")
    );

    await browser.storage.sync.remove(allKeys);
}

async function _getPageStorage(
    pageUrl: string
): Promise<{ [annotationId: string]: LindyAnnotation }> {
    // save in seperate item per page to not exceed QUOTA_BYTES_PER_ITEM
    const pageKey = `local-annotations_${pageUrl}`;
    const result = await browser.storage.sync.get(pageKey);
    return result?.[pageKey] || {};
}

async function _setPageStorage(
    pageUrl: string,
    pageStorage: { [annotationId: string]: LindyAnnotation }
): Promise<void> {
    const pageKey = `local-annotations_${pageUrl}`;
    await browser.storage.sync.set({
        [pageKey]: pageStorage,
    });
}
