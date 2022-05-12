import {
    getFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getLindyAnnotations } from "../sidebar/common/api";

export class TabStateManager {
    // store annotation counts per tab id, and update the badge text on active tab changes
    private annotationCounts: { [tabId: string]: number } = {};

    onChangeActiveTab(tabId: number) {
        this.renderBadgeCount(tabId);
    }

    onCloseTab(tabId: number) {
        // release storage
        delete this.annotationCounts[tabId];
    }

    // sent from boot.js if url passes denylist check
    async tabIsLikelyArticle(tabId: number, url: string) {
        const annotations = await getLindyAnnotations(url);
        this.annotationCounts[tabId] = annotations.length;

        this.renderBadgeCount(tabId);
    }

    // disable annotation count until re-enabled on this tab
    // correlates with disable / enable of social annotations, to make correlation more obvious
    hideAnnotationCount(tabId: number) {
        delete this.annotationCounts[tabId];
        this.renderBadgeCount(tabId);
    }

    private async renderBadgeCount(tabId: number) {
        // check feature flag every time in case user changed the setting
        const showAnnotationCount = await getFeatureFlag(
            showSocialAnnotationsDefaultFeatureFlag
        );
        if (!showAnnotationCount) {
            return;
        }

        const annotationCount = this.annotationCounts[tabId];
        const badgeText = annotationCount ? annotationCount.toString() : "";

        browser.action.setBadgeBackgroundColor({ color: "#6b7280" });
        browser.action.setBadgeText({ text: badgeText });
    }
}
