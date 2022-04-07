import { asideWordBlocklist } from "../modifications/DOM/textContainer";

const headerBlockList = [
    "responses", // https://blog.bradfieldcs.com/you-are-not-google-84912cf44afb
    "top stories",
    "table",
];
const endBlocklist = [
    "more from", //  https://blog.bradfieldcs.com/you-are-not-google-84912cf44afb
    "subscribe", // https://axie.substack.com/p/funding
];
export function getOutline() {
    const outline = [];
    const nodes = document.body.querySelectorAll("h1, h2, h3, h4");
    // h4, h5, h6 often used for side content or tagging, so ignore them
    // https://www.quantamagazine.org/researchers-identify-master-problem-underlying-all-cryptography-20220406/
    // h4 used at https://www.patriciabriggs.com/articles/silver/silverbullets.shtml

    for (const node of nodes) {
        if (node.offsetHeight === 0) {
            continue;
        }

        const level = parseInt(node.tagName.slice(1));
        let text = node.textContent.trim();
        text = text.split("\n").pop();
        while (text.includes("  ")) {
            text = text.replace(/  /g, " ");
        }
        if (text === "") {
            continue;
        }

        if (headerBlockList.some((word) => text.toLowerCase().includes(word))) {
            continue;
        }
        if (
            asideWordBlocklist.some(
                (word) =>
                    node.className.toLowerCase().includes(word) ||
                    node.id.toLowerCase().includes(word)
            )
        ) {
            continue;
        }
        if (endBlocklist.some((word) => text.toLowerCase().includes(word))) {
            break;
        }

        // const activeStyle = window.getComputedStyle(node);

        outline.push([level, text, node]);
    }
    console.log(outline);
}
