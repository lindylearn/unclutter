import { WebRequest, webRequest } from "webextension-polyfill";
import { boot } from "./boot";
import { enhance } from "./enhance";

webRequest.onHeadersReceived.addListener(
    addHeader,
    { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] },
    ["blocking", "responseHeaders"]
);

function addHeader(details: WebRequest.OnHeadersReceivedDetailsType) {
    var headers = details.responseHeaders;
    headers.push({
        name: "Content-Security-Policy",
        value: "script-src 'none';",
    });
}

function blockMediumScript() {
    const scripts = document.getElementsByTagName("script");
    const mediumCDN = "cdn-client.medium.com";

    for (let script of scripts) {
        if (script.src.includes(mediumCDN)) {
            document.head.removeChild(script);
            script.remove();
        }
    }
}

const observer = new MutationObserver((mutations: MutationRecord[], observer) => {
    for (let mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        if (addedNodes && addedNodes.some((node) => node.nodeName === "SCRIPT")) {
            blockMediumScript();
        }
        observer.disconnect();
    }
});

blockMediumScript();
observer.observe(document, { childList: true, subtree: true });

// Boot up unclutter then enhance the current page using unclutter
boot()
    .then(() => {
        enhance();
    })
    .catch((err: any) => {
        console.log(err.message);
    });
