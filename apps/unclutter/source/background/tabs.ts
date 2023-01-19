import type { Annotation } from "@unclutter/library-components/dist/store";
import browser from "../common/polyfill";

export class TabStateManager {
    private enabled = true;
    private tabAnnotations: { [tabId: string]: Annotation[] } = {};

    async onChangeActiveTab(tabId: number) {
        console.log("onChangeActiveTab", tabId);
        if (!this.enabled) {
            return;
        }

        this.renderBadgeCount(tabId);
    }

    onCloseTab(tabId: number) {
        console.log("onCloseTab", tabId);
        if (!this.enabled) {
            return;
        }

        // release storage
        delete this.tabAnnotations[tabId];
    }

    async setParsedAnnotations(tabId: number, annotations: Annotation[]) {
        console.log("setParsedAnnotations", tabId, annotations);
        if (!this.enabled) {
            return;
        }

        this.tabAnnotations[tabId] = annotations;

        this.renderBadgeCount(tabId);
    }

    async onActivateReaderMode(tabId: number) {}

    private async renderBadgeCount(tabId: number) {
        const annotationCount = this.tabAnnotations[tabId]?.length;
        const text = annotationCount ? annotationCount.toString() : "";

        browser.action.setBadgeBackgroundColor({ color: "#6b7280" });
        browser.action.setBadgeText({ text });
    }
}
