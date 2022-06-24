import React from "react";
import ReactDOM from "react-dom";
import browser, { getBrowserType } from "../common/polyfill";
import { createStylesheetLink } from "../common/stylesheets";
import "./index.css";
import OptionsPage from "./Options";

const browserType = getBrowserType();
if (browserType === "firefox") {
    createStylesheetLink(
        browser.runtime.getURL("settings-page/indexFirefoxOverride.css"),
        "dark-mode-ui-style"
    );
}

const domContainer = document.querySelector("#react-root");
ReactDOM.render(<OptionsPage />, domContainer);
