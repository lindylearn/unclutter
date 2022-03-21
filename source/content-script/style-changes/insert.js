import { overrideClassname } from "./background";
// Insert text behind the <body> background in case the site fails to render.

export function insertPageBrokenText() {
    const div = document.createElement("div");
    div.className = `${overrideClassname} lindy-page-broken`;
    div.innerHTML =
        ":( Page broken?<br />Please report it <a href='https://github.com/lindylearn/reader-extension/issues/new' target='_blank' rel='noopener noreferrer'>on GitHub</a>.";
    document.documentElement.appendChild(div);
}
