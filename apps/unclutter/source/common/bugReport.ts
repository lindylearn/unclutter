import { reportEvent } from "../background/metrics";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import browser, { getBrowserType } from "./polyfill";
import { getDomainFrom } from "./util";
import { ExtensionTypes } from "webextension-polyfill";
import { getPageReportCount, incrementPageReportCount } from "./storage";

// gather info from the page to report, and send event to background script (where we know the extension version)
export async function reportPageContentScript() {
    const url = window.location.href;
    const domain = getDomainFrom(new URL(url));

    browser.runtime.sendMessage(null, {
        event: "reportBrokenPage",
        data: {
            url,
            domain,
        },
    });
}

export async function handleReportBrokenPage(data) {
    const browserType = getBrowserType();
    const extensionInfo = await browser.management.getSelf();

    await incrementPageReportCount();
    const userReportCount = await getPageReportCount();

    let base64Screenshot: string;
    try {
        // take page screenshot showing the issue (bugs are hard to reproduce otherwise)
        // this code only runs when the user actively clicked the "report page" UI button, with the expectation
        // that the extension developer should take look at issues present on this URL
        base64Screenshot = await browser.tabs.captureVisibleTab({
            format: "jpeg",
            quality: 80,
        } as ExtensionTypes.ImageDetails);
    } catch (err) {
        console.error("Error taking page screenshot:", err);
    }

    try {
        await fetch(`https://api2.lindylearn.io/report_broken_page`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ...data,
                userAgent: navigator.userAgent,
                browserType,
                unclutterVersion: extensionInfo.version,
                screenshot: base64Screenshot,
                userReportCount,
            }),
        });
    } catch {}
    reportEvent("reportPage", { domain: data.domain });
}

export async function submitElementBlocklistContentScript(selectors: string[]) {
    const url = window.location.href;
    const domain = getDomainFrom(new URL(url));

    try {
        await fetch(`https://api2.lindylearn.io/report_blocked_elements`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                url,
                domain,
                selectors,
            }),
        });
    } catch {}
    reportEventContentScript("saveElementBlocker", {
        domain,
        selectorsCount: selectors.length,
    });
}
