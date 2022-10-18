import { openArticle } from "@unclutter/library-components/dist/common";
import type { Runtime, Omnibox } from "webextension-polyfill";

import browser, { getBrowserType } from "../common/polyfill";
import { userInfoStore } from "../common/settings";
import { reportEvent } from "./metrics";

console.log("worker loaded");

// handle events from unclutter library website or firefox content script proxy
browser.runtime.onMessage.addListener(processEvent);
browser.runtime.onMessageExternal.addListener(processEvent);

function processEvent(
    message: any,
    sender: Runtime.MessageSender,
    sendResponse: any
) {
    if (message.event === "setLibraryAuth") {
        console.log("Set library login");
        userInfoStore.set({
            userId: message.userId,
            webJwt: message.webJwt,
        });
    } else if (message.event === "reportEvent") {
        reportEvent(message.name, message.data);
    } else if (message.event === "openLibrary") {
        browser.tabs.update(undefined, {
            url: `https://library.lindylearn.io/`,
        });
    }
}
