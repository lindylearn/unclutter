import { boot } from "./boot";
import { enhance } from "./enhance";

// function addHeader(details: WebRequest.OnHeadersReceivedDetailsType) {
//     var headers = details.responseHeaders;
//     headers.push({
//         name: "Content-Security-Policy",
//         value: "script-src 'none';",
//     });
// }

// function blockMediumScript() {
//     const scripts = document.getElementsByTagName("script");
//     const mediumCDN = "cdn-client.medium.com";

//     const mediumRoot = document.body.childNodes[2];

//     for (let script of scripts) {
//         if (script.src.includes(mediumCDN)) {
//             mediumRoot.removeChild(script);
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

// const disableJavaScript = () => {
//     chrome.contentSettings.javascript.set({
//         primaryPattern: "*://http://webcache.googleusercontent.com/*",
//         scope: "regular",
//         setting: "block",
//     });
// };

// Boot up unclutter then enhance the current page using unclutter
boot()
    .then(() => {
        enhance();
    })
    .catch((err: any) => {
        console.log(err.message);
    });
