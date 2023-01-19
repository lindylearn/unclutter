import type { Annotation } from "@unclutter/library-components/dist/store";
import browser from "../common/polyfill";
import { rep } from "./library/library";
import { getArticleAnnotations, saveAIAnnotations } from "./library/smartHighlights";

export class TabStateManager {
    private enabled = false;
    private tabReaderModeActive: { [tabId: number]: boolean } = {};
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
        delete this.tabReaderModeActive[tabId];
        delete this.tabAnnotations[tabId];

        // clear badge
        this.renderBadgeCount(tabId);
    }

    // check saved annotations for a given url (without any network requests), to
    // determine if the user previously used the extension on this page
    async checkHasLocalAnnotations(tabId: number, articleId: string) {
        // update enabled status on every reader mode call
        // TODO cache this? but how to show counts once enabled?
        await this.checkEnabled();
        if (!this.enabled) {
            return;
        }

        // clear immediately after navigation
        this.tabReaderModeActive[tabId] = false;
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

        // highlights.ts may be injected by reader mode itself, so directly save annotations once available
        if (this.tabReaderModeActive[tabId]) {
            saveAIAnnotations(annotations);
        }

        this.renderBadgeCount(tabId);
    }

    async onActivateReaderMode(tabId: number) {
        if (!this.enabled) {
            return;
        }

        this.tabReaderModeActive[tabId] = true;

        const annotations = this.tabAnnotations[tabId];
        if (annotations?.length) {
            await saveAIAnnotations(annotations);
        }
    }

    private async renderBadgeCount(tabId: number) {
        const annotationCount = this.tabAnnotations[tabId]?.length;
        const text = annotationCount ? annotationCount.toString() : "";

        browser.action.setBadgeBackgroundColor({ color: "#facc15" });
        browser.action.setBadgeText({ text });
    }

    private async checkEnabled() {
        if (this.enabled) {
            return;
        }
        const userInfo = await rep.query.getUserInfo();
        this.enabled = !!userInfo?.aiEnabled;
    }
}
