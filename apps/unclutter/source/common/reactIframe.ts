import browser from "./polyfill";

// inject the annotations sidebar HTML elements, but don't show them yet
export function injectReactIframe(htmlUrl: string, id: string): HTMLIFrameElement {
    // the sidebar is running in a separate iframe to isolate personal information
    const iframeUrl = new URL(browser.runtime.getURL(htmlUrl));
    iframeUrl.searchParams.append("url", window.location.href);
    iframeUrl.searchParams.append("title", document.title);

    const iframe = document.createElement("iframe");
    iframe.classList.add("lindy-overlay-elem");
    iframe.src = iframeUrl.toString();
    iframe.id = id;
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameBorder", "0");

    document.documentElement.append(iframe);
    return iframe;
}

export function removeReactIframe(id: string) {
    const existingSidebar = document.getElementById(id);
    existingSidebar?.parentNode.removeChild(existingSidebar);
}

export async function waitUntilIframeLoaded(iframe: HTMLIFrameElement): Promise<void> {
    await new Promise((resolve) => iframe.addEventListener("load", resolve));
}

export function sendIframeEvent(iframe: HTMLIFrameElement, event: object) {
    iframe.contentWindow?.postMessage(event, "*");
}
