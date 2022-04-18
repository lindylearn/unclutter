import browser from "../../common/polyfill";

// inject the annotations sidebar HTML elements, but don't show them yet
export function injectSidebar() {
    // the sidebar is running in a separate iframe to isolate personal information
    const iframeUrl = new URL(browser.runtime.getURL("/sidebar/index.html"));
    iframeUrl.searchParams.append("url", window.location.href);

    const sidebarIframe = document.createElement("iframe");
    sidebarIframe.src = iframeUrl.toString();
    sidebarIframe.id = "lindylearn-annotations-sidebar";
    sidebarIframe.setAttribute("scrolling", "no");
    sidebarIframe.setAttribute("frameBorder", "0");

    document.documentElement.append(sidebarIframe);
    return sidebarIframe;
}

export function removeSidebar() {
    const existingSidebar = document.getElementById(
        "lindylearn-annotations-sidebar"
    );
    existingSidebar.parentNode.removeChild(existingSidebar);
}
