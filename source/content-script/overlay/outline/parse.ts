import { asideWordBlocklist } from "../../modifications/DOM/textContainer";
import { scrollToElement } from "./common";

export interface OutlineItem {
    index: number;
    title: string;
    level: number;
    element: Element;
    children: OutlineItem[];
}

const contentBlocklist = [
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
    "byline", // https://www.thedailybeast.com/inside-the-bitcoin-2022-conference-in-miami-beach
    "recirc", // https://www.theverge.com/23017107/crypto-billion-dollar-bridge-hack-decentralized-finance
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
        if (
            contentBlocklist.some((word) => text.toLowerCase().includes(word))
        ) {
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
        while (cleanText.includes("  ")) {
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
    const currentStack: OutlineItem[] = [
        {
            index: -1,
            level: 0,
            title: document.title,
            element: document.body,
            children: [],
        },
    ];
    for (const item of outline) {
        const parentElement = currentStack[currentStack.length - 1];

        if (item.level > parentElement.level) {
            // increased nesting on parent element
            currentStack.push(item);
        } else {
            // stack items with the same or higher nesting level are complete now
            while (item.level <= currentStack[currentStack.length - 1].level) {
                const completeItem = currentStack.pop();
                currentStack[currentStack.length - 1].children.push(
                    completeItem
                );
            }
            currentStack.push(item);
        }
    }
    while (
        currentStack.length >= 2 &&
        currentStack[currentStack.length - 2].level <=
            currentStack[currentStack.length - 1].level
    ) {
        const completeItem = currentStack.pop();
        currentStack[currentStack.length - 1].children.push(completeItem);
    }

    let outlineRoot: OutlineItem;
    if (currentStack[0].children.length === 1) {
        // only one site headings root, use that directly
        outlineRoot = currentStack[0].children[0];
    } else {
        outlineRoot = currentStack[0];
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
