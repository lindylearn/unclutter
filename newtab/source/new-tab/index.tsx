import React from "react";
import { createRoot } from "react-dom/client";
import debounce from "lodash/debounce";

import browser, { getBrowserType } from "../common/polyfill";
import App from "./App";

// render react
try {
    const domContainer = document.querySelector("#react-root");
    const root = createRoot(domContainer!);
    root.render(<App />);
} catch (err) {
    console.error(err);
}

// setup google search box
const debouncedInputChange = debounce(async (event) => {
    if (getBrowserType() === "chromium") {
        browser.search.query({
            text: event.target.value,
            disposition: "CURRENT_TAB",
        });
    } else {
        const tab = await browser.tabs.getCurrent();
        browser.search.search({
            query: event.target.value,
            tabId: tab.id,
        });
    }
}, 500);
const input = document.querySelector("#search-input");
input.addEventListener("input", debouncedInputChange);
