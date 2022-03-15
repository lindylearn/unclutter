import React from "react";
import ReactDOM from "react-dom";
import browser from "../common/polyfill";
import Popup from "./Popup";

browser.tabs
    .query({
        active: true,
        currentWindow: true,
    })
    .then((tabs) => {
        browser.runtime.sendMessage(null, {
            event: "enablePageView",
            tabId: tabs[0].id,
        });
    });

const domContainer = document.querySelector("#react-root");
ReactDOM.render(<Popup />, domContainer);
