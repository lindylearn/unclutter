export function getBrowser(): any {
    // @ts-ignore
    return typeof browser !== "undefined" ? browser : chrome;
}
type BrowserType = "chromium" | "firefox";
export function getBrowserType(): BrowserType {
    // @ts-ignore
    if (typeof browser !== "undefined") {
        return "firefox";
    } else {
        return "chromium";
    }
}
export function getBrowserTypeWeb(): BrowserType {
    // navigator.userAgentData only available in chrome & edge
    try {
        const isChrome =
            // @ts-ignore
            navigator.userAgentData?.brands.map((b) => b.brand).includes("Chromium") || false;
        return isChrome ? "chromium" : "firefox";
    } catch {
        return "chromium";
    }
}

export function getUnclutterExtensionId(): string {
    return getBrowserType() === "chromium"
        ? "ibckhpijbdmdobhhhodkceffdngnglpk"
        : "{8f8c4c52-216c-4c6f-aae0-c214a870d9d9}";
}

// send a message to the Unclutter or Unclutter library extension
export function sendMessage(message: object): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            // preferrable send message to extension directly (https://developer.chrome.com/docs/extensions/mv3/messaging/#external-webpage)
            // this is the only way to send data from extension to extension
            getBrowser().runtime.sendMessage(getUnclutterExtensionId(), message, resolve);
        } catch (err) {
            // proxy with boot.js content script, e.g. for Firefox (see listenForPageEvents())
            const messageId = Math.random().toString(36).slice(2);
            const listener = (event: MessageEvent) => {
                if (
                    event.data.event === "proxyUnclutterMessageResponse" &&
                    event.data.messageId === messageId
                ) {
                    resolve(event.data.response);

                    window.removeEventListener("message", listener);
                }
            };
            window.addEventListener("message", listener);
            window.postMessage(
                {
                    event: "proxyUnclutterMessage",
                    messageId,
                    message,
                },
                "*"
            );

            // pre 1.7.1 fallback, does not support responses
            window.postMessage(message, "*");
        }
    });
}

export function openArticleResilient(url: string, newTab: boolean = true, annotationId?: string) {
    sendMessage({
        event: "openLinkWithUnclutter",
        url,
        newTab,
        annotationId,
    });
}

export function setUnclutterLibraryAuth(userId: string) {
    sendMessage({
        event: "setLibraryAuth",
        userId,
        webJwt: document.cookie, // requires disabled httpOnly flag, set via patch-package
    });
}
