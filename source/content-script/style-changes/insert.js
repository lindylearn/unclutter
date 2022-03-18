import { overrideClassname } from "./background";

// Insert text behind the <body> background in case the site fails to render.
export function insertReportButton() {
    const div = document.createElement("div");
    div.className = `${overrideClassname} report-broken`;
    div.innerHTML =
        ":( Page broken?<br />Please report it <a href='https://github.com/lindylearn/reader-extension/issues/new' target='_blank' rel='noopener noreferrer'>on GitHub</a>.";
    document.documentElement.appendChild(div);
}

// button to share the annotations of the active page
function insertShareButton() {
    var a = document.createElement("a");
    a.href = `https://annotations.lindylearn.io/page?url=${window.location.href}`;
    a.className = `${overrideClassname} share-icon`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);

    var img = document.createElement("img");
    img.src = browser.runtime.getURL("assets/icons/share.svg");
    a.appendChild(img);
}
