import {
    getFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
    supportSocialAnnotations,
} from "../common/featureFlags";
import browser from "../common/polyfill";
import { getLindyAnnotations } from "../sidebar/common/api";
import { getRemoteFeatureFlags } from "./metrics";

export class TabStateManager {
    // store annotation counts per tab id, and update the badge text on active tab changes
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

    // sent from boot.js if url passes denylist check
    async tabIsLikelyArticle(tabId: number, url: string) {
        console.log(1);

        if (!(await this.isCountEnabled())) {
            return;
        }

        if (!this.annotationCounts[tabId]) {
            console.log("fetch annotations for tab");
            const annotations = await getLindyAnnotations(url);
            this.annotationCounts[tabId] = annotations.length;
        }

        this.renderBadgeCount(tabId);
    }

    // disable annotation count until re-enabled on this tab
    // correlates with disable / enable of social annotations, to make correlation more obvious
    hideAnnotationCount(tabId: number) {
        delete this.annotationCounts[tabId];
        this.renderBadgeCount(tabId);
    }

    private async renderBadgeCount(tabId: number) {
        const annotationCount = this.annotationCounts[tabId];
        const badgeText = annotationCount ? annotationCount.toString() : "";

        browser.action.setBadgeBackgroundColor({ color: "#6b7280" });
        browser.action.setBadgeText({ text: badgeText });
    }

    // check settings every time in case user changed it
    private async isCountEnabled(): Promise<boolean> {
        const featureEnabled = (await getRemoteFeatureFlags())?.[
            supportSocialAnnotations
        ];
        if (!featureEnabled) {
            return false;
        }
        const showAnnotationCount = await getFeatureFlag(
            showSocialAnnotationsDefaultFeatureFlag
        );
        return showAnnotationCount;
    }
}
