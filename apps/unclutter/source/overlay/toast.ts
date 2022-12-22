import { insertHtml } from "../common/html";

export async function displayToast(message: string, onClick: () => void = () => {}) {
    if (document.getElementById("lindy-toast")) {
        return;
    }

    const container = insertHtml(
        "lindy-toast",
        `<div class="lindy-toast-content">
            <div class="lindy-toast-message">
                ${message}
            </div>
        </div>
        <div class="lindy-toast-progressbar"></div>`
    );
    container.classList.add("lindy-toast-visible");

    container.onclick = () => {
        container.classList.add("lindy-toast-dismissed");
        setTimeout(removeToast, 1000);

        onClick();
    };
}
export function removeToast() {
    const container = document.getElementById("lindy-toast");
    container?.remove();

    // in case this runs before insert() above, set placeholder
    insertHtml("lindy-toast", "");
}
