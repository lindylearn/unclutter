import { boot } from "./boot";
import { enhance } from "./enhance";

// NOTES: Cannot directly update HTML contents
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

// NOTES: MutationObserver not defined, maybe this is used in the wrong place
// const observer = new MutationObserver((mutations: MutationRecord[], observer) => {
//     for (let mutation of mutations) {
//         const addedNodes = Array.from(mutation.addedNodes);
//         if (addedNodes && addedNodes.some((node) => node.nodeName === "SCRIPT")) {
//             blockMediumScript();
//         }
//         observer.disconnect();
//     }
// });

// NOTES: Block scripts/requests using webRequests not working with manifestV3
// Manifest v3 have changed this to be managed by rules
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

// NOTES: Settings contentSettings to disable JS not working as expected
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
