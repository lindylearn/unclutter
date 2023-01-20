import { getUrlHash } from "@unclutter/library-components/dist/common/url";
import { createAnnotation, LindyAnnotation } from "../../common/annotations/create";
import browser from "../../common/polyfill";

export async function getAllLegacyAnnotations(): Promise<LindyAnnotation[]> {
    const allStorage = await browser.storage.local.get(null);

    const allAnnotations: LindyAnnotation[] = Object.keys(allStorage)
        .filter((pageKey) => pageKey.startsWith("local-annotations_"))
        .reduce((list, pageKey) => [...list, ...Object.values(allStorage[pageKey])], [])
        .map((annotation) => {
            return createAnnotation(getUrlHash(annotation.url), annotation.quote_html_selector, {
                ...annotation,
                created_at: new Date(annotation.created_at).toISOString(),
                isMyAnnotation: true,
            });
        });

    return allAnnotations;
}

export async function deleteAllLegacyAnnotations(
    storageArea: "local" | "sync" = "local"
): Promise<void> {
    const allStorage = await browser.storage[storageArea].get(null);

    const allKeys = Object.keys(allStorage).filter((pageKey) =>
        pageKey.startsWith("local-annotations_")
    );

    await browser.storage[storageArea].remove(allKeys);
}

export async function getHiddenAnnotations() {
    const storage = await browser.storage.local.get("hidden-social-annotations");
    return storage["hidden-social-annotations"] || {};
}

export async function hideAnnotationLocally(annotation: LindyAnnotation) {
    const storage = await getHiddenAnnotations();
    storage[annotation.id] = true;
    await browser.storage.local.set({
        "hidden-social-annotations": storage,
    });
}
