import { overrideClassname } from "./stylesheets";

export function insertHtml(className: string, html: string) {
    const container = document.createElement("div");
    container.className = `${overrideClassname} ${className}`;
    container.id = className;
    container.innerHTML = html;
    document.documentElement.appendChild(container);
    return container;
}
