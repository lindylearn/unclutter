import browser from "../common/polyfill";
import { createStylesheetLink } from "../common/stylesheets";

window.addEventListener("message", ({ data }) => {
    if (data.event === "setCssVariable") {
        document.body.style.setProperty(data.key, data.value);
    } else if (data.event === "setDarkMode") {
        if (data.darkModeEnabled) {
            document.body.classList.add("dark");
            createStylesheetLink(
                browser.runtime.getURL("modal/dark.css"),
                "dark-mode-ui-style",
                document?.head.lastChild as HTMLElement
            );
        } else {
            document.body.classList.remove("dark");
            document
                ?.querySelectorAll(".dark-mode-ui-style")
                .forEach((e) => e.remove());
        }
    } else if (data.event === "setLibraryState") {
        // save global variable accessed during initial app render
        window["libraryState"] = data.libraryState;
    }
});

window.top.postMessage({ event: "modalIframeLoaded" }, "*");
