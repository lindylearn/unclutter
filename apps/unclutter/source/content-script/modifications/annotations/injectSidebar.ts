import browser from "../../../common/polyfill";

// inject the annotations sidebar HTML elements, but don't show them yet
export function injectSidebar() {
    // the sidebar is running in a separate iframe to isolate personal information
    const iframeUrl = new URL(browser.runtime.getURL("/sidebar/index.html"));
    iframeUrl.searchParams.append("url", window.location.href);
    iframeUrl.searchParams.append("title", document.title);

    const sidebarIframe = document.createElement("iframe");
    sidebarIframe.classList.add("lindy-allowed-elem");
    sidebarIframe.src = iframeUrl.toString();
    sidebarIframe.id = "lindy-annotations-bar";
    sidebarIframe.setAttribute("scrolling", "no");
    sidebarIframe.setAttribute("frameBorder", "0");

    document.documentElement.append(sidebarIframe);
    return sidebarIframe;
}

export function removeSidebar() {
    const existingSidebar = document.getElementById("lindy-annotations-bar");
    existingSidebar?.parentNode.removeChild(existingSidebar);
}

export async function waitUntilIframeLoaded(iframe: HTMLIFrameElement): Promise<void> {
    await new Promise((resolve) => iframe.addEventListener("load", resolve));
}

function getSidebarIframe(): HTMLIFrameElement {
    return document.getElementById("lindy-annotations-bar") as HTMLIFrameElement;
}
