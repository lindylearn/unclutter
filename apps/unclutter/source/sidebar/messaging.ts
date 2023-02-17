import browser from "../common/polyfill";
import { createStylesheetLink } from "../common/stylesheets";

window.addEventListener("message", ({ data }) => {
    if (data.event === "setCssVariable") {
        document.body.style.setProperty(data.key, data.value);
    } else if (data.event === "setDarkMode") {
        if (data.darkModeEnabled) {
            document.body.classList.add("dark");
            createStylesheetLink(
                browser.runtime.getURL("sidebar/dark.css"),
                "dark-mode-ui-style",
                document?.head.lastChild as HTMLElement
            );
        } else {
            document.body.classList.remove("dark");
            document?.querySelectorAll(".dark-mode-ui-style").forEach((e) => e.remove());
        }
    }
});

window.top.postMessage({ event: "sidebarIframeLoaded" }, "*");
