import type { Annotation } from "@unclutter/library-components/dist/store";
import browser from "../common/polyfill";
import { getArticleAnnotations, saveAnnotations } from "./library/smartHighlights";

export class TabStateManager {
    private enabled = true;
    private tabAnnotations: { [tabId: string]: Annotation[] } = {};

    onChangeActiveTab(tabId: number) {
        if (!this.enabled) {
            return;
        }

        this.renderBadgeCount(tabId);
    }

    onCloseTab(tabId: number) {
        if (!this.enabled) {
            return;
        }

        // release storage
        delete this.tabAnnotations[tabId];

        // clear badge
        this.renderBadgeCount(tabId);
    }

    // check saved annotations for a given url (without any network requests), to
    // determine if the user previously used the extension on this page
    async checkHasLocalAnnotations(tabId: number, articleId: string) {
        if (!this.enabled) {
            return;
        }
        // clear immediately after navigation
        this.tabAnnotations[tabId] = undefined;

        this.tabAnnotations[tabId] = await getArticleAnnotations(articleId);
        this.renderBadgeCount(tabId);

        return this.tabAnnotations[tabId].length > 0;
    }

    hasParsedAnnotations(tabId: number) {
        if (!this.enabled) {
            return false;
        }

        const aiAnnotations = this.tabAnnotations[tabId]?.filter((a) => a.ai_created) || [];
        return aiAnnotations.length > 0;
    }

    setParsedAnnotations(tabId: number, annotations: Annotation[]) {
        if (!this.enabled) {
            return;
        }

        this.tabAnnotations[tabId] = annotations;

        this.renderBadgeCount(tabId);
    }

    async onActivateReaderMode(tabId: number) {
        const annotations = this.tabAnnotations[tabId];
        if (annotations?.length) {
            await saveAnnotations(annotations);
        }
    }

    private async renderBadgeCount(tabId: number) {
        const annotationCount = this.tabAnnotations[tabId]?.length;
        const text = annotationCount ? annotationCount.toString() : "";

        browser.action.setBadgeBackgroundColor({ color: "#facc15" });
        browser.action.setBadgeText({ text });
    }
}
