import {
    LindyAnnotation,
    PickledAnnotation,
    pickleLocalAnnotation,
    unpickleLocalAnnotation,
} from "../../common/annotations/create";
import browser from "../../common/polyfill";

/**
 * The local annotations state is only used if the hypothesis sync isn't enabled (yet).
 */

export async function getLocalAnnotations(
    pageUrl: string
): Promise<LindyAnnotation[]> {
    const storage = await _getPageStorage(pageUrl);

    return Object.values(storage).map(unpickleLocalAnnotation);
}

export async function createLocalAnnotation(
    annotation: LindyAnnotation
): Promise<LindyAnnotation> {
    const storage = await _getPageStorage(annotation.url);

    storage[annotation.id] = pickleLocalAnnotation(annotation);

    await _setPageStorage(annotation.url, storage);

    return annotation;
}

export async function updateLocalAnnotation(
    annotation: LindyAnnotation
): Promise<void> {
    const storage = await _getPageStorage(annotation.url);

    storage[annotation.id] = pickleLocalAnnotation(annotation);

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
    const allStorage = await browser.storage.local.get(null);

    const allAnnotations: LindyAnnotation[] = Object.keys(allStorage)
        .filter((pageKey) => pageKey.startsWith("local-annotations_"))
        .reduce(
            (list, pageKey) => [...list, ...Object.values(allStorage[pageKey])],
            []
        )
        .map(unpickleLocalAnnotation);

    return allAnnotations;
}

export async function deleteAllLocalAnnotations(
    storageArea: "local" | "sync" = "local"
): Promise<void> {
    const allStorage = await browser.storage[storageArea].get(null);

    const allKeys = Object.keys(allStorage).filter((pageKey) =>
        pageKey.startsWith("local-annotations_")
    );

    await browser.storage[storageArea].remove(allKeys);
}

async function _getPageStorage(
    pageUrl: string
): Promise<{ [annotationId: string]: PickledAnnotation }> {
    // save in seperate item per page to reduce serialization overhead
    const pageKey = `local-annotations_${pageUrl}`;
    const result = await browser.storage.local.get(pageKey);
    return result?.[pageKey] || {};
}

async function _setPageStorage(
    pageUrl: string,
    pageStorage: { [annotationId: string]: PickledAnnotation }
): Promise<void> {
    const pageKey = `local-annotations_${pageUrl}`;
    await browser.storage.local.set({
        [pageKey]: pageStorage,
    });
}

// migrate annotations saved in browser.storage.sync to browser.storage.local, as the former has very low storage quotas
export async function migrateAnnotationStorage() {
    const localStorage = await browser.storage.local.get(null);
    if (Object.keys(localStorage).length !== 0) {
        // already migrated, or sync == local storage
        return;
    }

    const allStorage = await browser.storage.sync.get(null);
    const annotationStorage = Object.entries(allStorage)
        .filter(([pageKey, _]) => pageKey.startsWith("local-annotations_"))
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

    console.log("migrating sync annotations:", annotationStorage);

    await browser.storage.local.set(annotationStorage);
    await deleteAllLocalAnnotations("sync");
}
