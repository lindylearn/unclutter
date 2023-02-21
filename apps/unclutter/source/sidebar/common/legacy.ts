import { LindyAnnotation } from "../../common/annotations/create";
import browser from "../../common/polyfill";

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
