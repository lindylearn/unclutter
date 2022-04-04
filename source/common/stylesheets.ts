export const overrideClassname = "lindylearn-document-override";

export function createStylesheetLink(url, styleId) {
    const link = document.createElement("link");
    link.classList.add(overrideClassname);
    link.classList.add(styleId);
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);

    return link;
}

export function createStylesheetText(
    text,
    styleId,
    insertAfter: HTMLElement = null
) {
    const style = document.createElement("style");
    style.classList.add(overrideClassname);
    style.classList.add(styleId);
    style.type = "text/css";
    style.rel = "stylesheet";
    style.innerHTML = text;

    if (insertAfter) {
        insertAfter.parentElement.insertBefore(
            style,
            insertAfter?.nextSibling || insertAfter
        );
    } else {
        document.head.appendChild(style);
    }

    return style;
}
