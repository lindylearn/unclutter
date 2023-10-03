// import { webRequest, WebRequest } from "webextension-polyfill";

function addHeader(details: WebRequest.OnHeadersReceivedDetailsType) {
    var headers = details.responseHeaders;
    headers.push({
        name: "Content-Security-Policy",
        value: "script-src 'none';",
    });
}

// function blockMediumScript() {
//     const scripts = document.getElementsByTagName("script");
//     const mediumCDN = "cdn-client.medium.com";

//     for (let script of scripts) {
//         if (script.src.includes(mediumCDN)) {
//             document.head.removeChild(script);
//             script.remove();
//         }
//     }
// }

// const observer = new MutationObserver((mutations: MutationRecord[], observer) => {
//     for (let mutation of mutations) {
//         const addedNodes = Array.from(mutation.addedNodes);
//         if (addedNodes && addedNodes.some((node) => node.nodeName === "SCRIPT")) {
//             blockMediumScript();
//         }
//         observer.disconnect();
//     }
// });

// export function blockAllMediumScripts() {
//     blockMediumScript();
//     observer.observe(document, { childList: true, subtree: true });

//     webRequest.onHeadersReceived.addListener(
//         addHeader,
//         {
//             urls: ["*://http://webcache.googleusercontent.com/*"],
//             types: ["main_frame", "sub_frame"],
//         },
//         ["blocking", "responseHeaders"]
//     );
// }

export const disableJavaScript = () => {
    chrome.contentSettings.javascript.set({
        primaryPattern: "*://http://webcache.googleusercontent.com/*",
        scope: "regular",
        setting: "block",
    });
};

export const blockScriptWithHeaders = () => {
    console.log("Starting background script");

    chrome.webRequest.onHeadersReceived.addListener(
        function (details) {
            const headers = details.responseHeaders;
            headers.push({
                name: "Content-Security-Policy",
                value: "script-src 'none';",
            });
            return { responseHeaders: headers };
        },
        {
            urls: ["<all_urls>"],
            types: ["main_frame", "sub_frame"],
        },
        ["blocking", "responseHeaders"]
    );

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            return { cancel: true };
        },
        { urls: ["<all_urls>"] },
        ["blocking"]
    );
};
