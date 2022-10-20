import { enableSocialCountsFeatureFlag, getFeatureFlag } from "../common/featureFlags";
import browser from "../common/polyfill";
import { getSocialCommentsCount } from "./annotationCounts";

export class TabStateManager {
    // store annotation counts per tab id, and update the badge text on active tab changes
    // this avoids having to check the large counts map every time
    private annotationCounts: { [tabId: string]: number } = {};

    async onChangeActiveTab(tabId: number) {
        if (!(await this.isCountEnabled())) {
            return;
        }

        this.renderBadgeCount(tabId);
    }

    onCloseTab(tabId: number) {
        // release storage
        delete this.annotationCounts[tabId];
    }

    // check annotation counts for this url (locally, without a remote request)
    // show count in extension badge if enabled, and return if we found annotations
    async checkIsArticle(tabId: number, url: string): Promise<boolean> {
        if (this.annotationCounts[tabId] === undefined) {
            this.annotationCounts[tabId] = await getSocialCommentsCount(url);
        }

        if (await this.isCountEnabled()) {
            this.renderBadgeCount(tabId);
        }

        return !!this.annotationCounts[tabId];
    }

    async getSocialAnnotationsCount(tabId: number, url: string): Promise<number> {
        // use cached value if present -- is more accurate as updated by anchoring
        if (this.annotationCounts[tabId]) {
            return this.annotationCounts[tabId];
        }

        return await getSocialCommentsCount(url);
    }

    // update from content script, how many annotations actually displayed
    async setSocialAnnotationsCount(tabId: number, count: number) {
        if (this.annotationCounts[tabId] === count) {
            return;
        }

        this.annotationCounts[tabId] = count;

        if (await this.isCountEnabled()) {
            this.renderBadgeCount(tabId);
        }
    }

    private async renderBadgeCount(tabId: number) {
        const annotationCount = this.annotationCounts[tabId];
        const badgeText = annotationCount ? annotationCount.toString() : "";

        browser.action.setBadgeBackgroundColor({ color: "#6b7280" });
        browser.action.setBadgeText({ text: badgeText });
    }

    // check settings every time in case user changed it
    private async isCountEnabled(): Promise<boolean> {
        const showAnnotationCount = await getFeatureFlag(enableSocialCountsFeatureFlag);
        return showAnnotationCount;
    }
}
