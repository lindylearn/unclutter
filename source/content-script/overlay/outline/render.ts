import { insertHtml } from "source/common/html";
import browser from "../../../common/polyfill";
import { createStylesheetLink } from "../../../common/stylesheets";
import { OutlineItem } from "./parse";

export async function renderOutline(outline: OutlineItem[]) {
    createStylesheetLink(
        browser.runtime.getURL("content-script/overlay/outline/outline.css"),
        "outline-style"
    );

    //     <div>
    //     <svg class="lindy-outline-icon" viewBox="0 0 576 512">
    //         <path fill="currentColor" d="M320 0H64C28.65 0 0 28.65 0 64v384c0 35.35 28.65 64 64 64h256c35.35 0 64-28.65 64-64V64C384 28.65 355.3 0 320 0zM208 352h-128C71.16 352 64 344.8 64 336S71.16 320 80 320h128c8.838 0 16 7.164 16 16S216.8 352 208 352zM304 256h-224C71.16 256 64 248.8 64 240S71.16 224 80 224h224C312.8 224 320 231.2 320 240S312.8 256 304 256zM304 160h-224C71.16 160 64 152.8 64 144S71.16 128 80 128h224C312.8 128 320 135.2 320 144S312.8 160 304 160z"/>
    //     </svg>
    // </svg>
    //     Article
    //     <ul>
    //         <li>3 min read</li>
    //     </ul>
    // <div>
    //     <svg class="lindy-outline-icon" viewBox="0 0 576 512">
    //     <path fill="currentColor" d="M72 48C85.25 48 96 58.75 96 72V120C96 133.3 85.25 144 72 144V232H128C128 218.7 138.7 208 152 208H200C213.3 208 224 218.7 224 232V280C224 293.3 213.3 304 200 304H152C138.7 304 128 293.3 128 280H72V384C72 388.4 75.58 392 80 392H128C128 378.7 138.7 368 152 368H200C213.3 368 224 378.7 224 392V440C224 453.3 213.3 464 200 464H152C138.7 464 128 453.3 128 440H80C49.07 440 24 414.9 24 384V144C10.75 144 0 133.3 0 120V72C0 58.75 10.75 48 24 48H72zM160 96C160 78.33 174.3 64 192 64H480C497.7 64 512 78.33 512 96C512 113.7 497.7 128 480 128H192C174.3 128 160 113.7 160 96zM288 256C288 238.3 302.3 224 320 224H480C497.7 224 512 238.3 512 256C512 273.7 497.7 288 480 288H320C302.3 288 288 273.7 288 256zM288 416C288 398.3 302.3 384 320 384H480C497.7 384 512 398.3 512 416C512 433.7 497.7 448 480 448H320C302.3 448 288 433.7 288 416z"/>
    // </svg>
    // Outline
    const container = insertHtml(
        "lindy-info-topleft",
        `<div class="lindy-outline">
            <ul class="lindy-outline-list">
                ${outline?.[0].children.map(getOutlineItemHtml).join("")}
            </ul>
        </div>`
    );

    function getOutlineItemHtml({
        level,
        title,
        element,
        children,
    }: OutlineItem) {
        return `<li class="lindy-outline-item">
        <span>${title}</span>
        ${
            children.length > 0
                ? `
                <ul>
                    ${children.map(getOutlineItemHtml).join("")}
                </ul>`
                : ""
        }
    </li>`;
    }

    // container.onclick = () => {
    //     container.classList.add("lindy-toast-dismissed");
    //     setTimeout(removeToast, 1000);

    //     onClick();
    // };
}
export function removeOutline() {
    const container = document.getElementById("lindy-toast");
    container?.remove();
}
