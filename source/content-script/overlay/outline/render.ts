import browser from "../../../common/polyfill";
import { createStylesheetLink } from "../../../common/stylesheets";
import Outline from "./Outeline.svelte";
import { OutlineItem } from "./parse";

export async function renderOutline(outline: OutlineItem[]) {
    createStylesheetLink(
        browser.runtime.getURL("content-script/overlay/outline/outline.css"),
        "outline-style"
    );

    const container = document.createElement("div");
    document.documentElement.appendChild(container);

    new Outline({
        target: container,
        props: { outline },
    });
}
export function removeOutline() {
    const container = document.getElementById("lindy-toast");
    container?.remove();
}
