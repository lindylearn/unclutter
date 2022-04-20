import React from "react";
import ReactDOM from "react-dom";
import { createStylesheetLink } from "source/common/stylesheets";
import browser from "../common/polyfill";
import App from "./App";
import "./index.css";

window.addEventListener("message", ({ data }) => {
    if (data.event === "setCssVarible") {
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

const urlParams = new URLSearchParams(document.location.search);
const domContainer = document.querySelector("#react-root");
ReactDOM.render(<App {...Object.fromEntries(urlParams)} />, domContainer);
