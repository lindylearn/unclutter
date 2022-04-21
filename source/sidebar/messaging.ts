import { createStylesheetLink } from "source/common/stylesheets";
import browser from "../common/polyfill";

window.addEventListener("message", ({ data }) => {
    if (data.event === "setCssVariable") {
        document.body.style.setProperty(data.key, data.value);
    } else if (data.event === "setDarkMode") {
        if (data.darkModeEnabled) {
            createStylesheetLink(
                browser.runtime.getURL("sidebar/dark.css"),
                "dark-mode-ui-style",
                document?.head.lastChild as HTMLElement
            );
        } else {
            document
                ?.querySelectorAll(".dark-mode-ui-style")
                .forEach((e) => e.remove());
        }
    }
});

window.top.postMessage({ event: "sidebarIframeLoaded" }, "*");
