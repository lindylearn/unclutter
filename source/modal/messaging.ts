import browser from "../common/polyfill";
import { createStylesheetLink } from "../common/stylesheets";

window.addEventListener("message", ({ data }) => {
    if (data.event === "setCssVariable") {
        document.body.style.setProperty(data.key, data.value);
    } else if (data.event === "setDarkMode") {
        if (data.darkModeEnabled) {
            createStylesheetLink(
                browser.runtime.getURL("modal/dark.css"),
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

window.top.postMessage({ event: "modalIframeLoaded" }, "*");
