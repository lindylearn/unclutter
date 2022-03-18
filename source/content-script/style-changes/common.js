export const overrideClassname = "lindylearn-document-override";

export function createStylesheetLink(url) {
    var link = document.createElement("link");
    link.classList.add(overrideClassname);
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
}

export function createStylesheetText(text, styleId) {
    var style = document.createElement("style");
    style.classList.add(overrideClassname);
    style.classList.add(styleId);
    style.type = "text/css";
    style.rel = "stylesheet";
    style.innerHTML = text;
    document.head.appendChild(style);
}
