import { asideWordBlocklist } from "../../modifications/DOM/textContainer";
import { scrollToElement } from "./common";

export interface OutlineItem {
    index: number;
    title: string;
    level: number;
    element: Element;
    children: OutlineItem[];
}

const headerBlockList = [
    "responses", // https://blog.bradfieldcs.com/you-are-not-google-84912cf44afb
    "top stories",
    "table",
    "advertisement",
];
const classBlocklist = [
    "subtitle", // https://lunduke.substack.com/p/the-computers-used-to-do-3d-animation?s=r
    "author", // https://www.scientificamerican.com/article/birds-make-better-bipedal-bots-than-humans-do/
    "suggested", // https://www.scientificamerican.com/article/birds-make-better-bipedal-bots-than-humans-do/
    "promo", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#support-knowable-magazine
    "more", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#support-knowable-magazine
];
const endBlocklist = [
    "more from", //  https://blog.bradfieldcs.com/you-are-not-google-84912cf44afb
    "subscribe", // https://axie.substack.com/p/funding
    "related", // https://stackoverflow.blog/2022/04/07/you-should-be-reading-academic-computer-science-papers/
    "comments", // https://www.bennadel.com/blog/4210-you-can-throw-anything-in-javascript-and-other-async-await-considerations.htm
];
export function getOutline(): OutlineItem {
    const outline: OutlineItem[] = [];

    // parse heading from DOM
    const nodes = document.body.querySelectorAll("h1, h2, h3, h4");
    // h4, h5, h6 often used for side content or tagging, so ignore them
    // https://www.quantamagazine.org/researchers-identify-master-problem-underlying-all-cryptography-20220406/
    // h4 used at https://www.patriciabriggs.com/articles/silver/silverbullets.shtml
    let index = 0;
    for (const node of nodes) {
        // Ignore invisible or removed elements
        if (node.offsetHeight === 0) {
            continue;
        }

        // Ignore specific words & css classes
        const text = node.textContent;
        if (headerBlockList.some((word) => text.toLowerCase().includes(word))) {
            continue;
        }
        if (
            asideWordBlocklist
                .filter((word) => !["header", "ad"].includes(word))
                .concat(classBlocklist)
                .some(
                    (word) =>
                        node.className.toLowerCase().includes(word) ||
                        node.id.toLowerCase().includes(word) ||
                        node.parentElement.className
                            .toLowerCase()
                            .includes(word)
                )
        ) {
            continue;
        }
        if (endBlocklist.some((word) => text.toLowerCase().includes(word))) {
            break;
        }

        // Clean heading text
        let cleanText = text.trim().split("\n").pop();
        while (text.includes("  ")) {
            cleanText = cleanText.replace(/  /g, " ");
        }
        if (cleanText === "") {
            continue;
        }

        // Construct hierarchy based on <hX> level
        const level = parseInt(node.tagName.slice(1));
        outline.push({
            index,
            title: cleanText,
            level,
            element: node,
            children: [], // populated below
        });
        index += 1;
    }

    if (outline.length === 0) {
        return null;
    }

    // create ids for linking if not present
    // addHeadingIds(outline);

    // Collapse elements
    const collapsedOutline: OutlineItem[] = [outline[0]]; // stack
    for (const item of outline.slice(1)) {
        const lastItem = collapsedOutline[collapsedOutline.length - 1];
        if (item.level > lastItem.level) {
            lastItem.children.push(item);
        } else {
            // lastItem is complete now
            collapsedOutline.push(item);
        }
    }

    let outlineRoot: OutlineItem;
    if (collapsedOutline.length === 1) {
        outlineRoot = collapsedOutline[0];
    } else {
        outlineRoot = {
            index: -1,
            level: 0,
            title: document.title,
            element: document.body,
            children: collapsedOutline,
        };
    }

    function normalizeOutlineItem(
        item: OutlineItem,
        currentLevel: number = 0
    ): OutlineItem {
        return {
            ...item,
            level: currentLevel,
            children: item.children.map((child) =>
                normalizeOutlineItem(child, currentLevel + 1)
            ),
        };
    }
    const normalizedOutline = normalizeOutlineItem(outlineRoot);

    console.log(normalizedOutline);

    return normalizedOutline;
}

function addHeadingIds(flatOutline: OutlineItem[]) {
    flatOutline.map(({ element, title }) => {
        if (!element.id) {
            // create id for linking
            element.id = title.replace(/ /g, "-").toLowerCase();

            // TODO strip non-alphanumeric
        }
    });
}

export function scrollToFragmentHeading() {
    if (!window.location.hash) {
        // no header linked
        return;
    }
    const element = document.getElementById(window.location.hash?.slice(1));
    scrollToElement(element);
}
