import { asideWordBlocklist } from "source/content-script/modifications/DOM/textContainer";
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
    "most read",
    "newsletter",
];
const classBlocklist = [
    "subtitle", // https://lunduke.substack.com/p/the-computers-used-to-do-3d-animation?s=r
    "author", // https://www.scientificamerican.com/article/birds-make-better-bipedal-bots-than-humans-do/
    "suggested", // https://www.scientificamerican.com/article/birds-make-better-bipedal-bots-than-humans-do/
    "promo", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#support-knowable-magazine
    "more", // https://knowablemagazine.org/article/health-disease/2021/how-noise-pollution-affects-heart-health#support-knowable-magazine
    "byline", // https://www.thedailybeast.com/inside-the-bitcoin-2022-conference-in-miami-beach
    "recirc", // https://www.theverge.com/23017107/crypto-billion-dollar-bridge-hack-decentralized-finance
    "card", // https://www.science.org/doi/10.1126/science.abk1781?cookieSet=1#single-cell-rna-seq-reveals-cell-type%E2%80%93specific
    "latest", // https://reason.com/2022/04/08/the-fbi-decided-not-to-knock-down-a-suspects-front-door-because-it-was-an-affluent-neighborhood
    "recent_post",
    "recent-post",
    "upperdek", // https://arstechnica.com/tech-policy/2022/04/an-old-music-industry-scheme-revived-for-the-spotify-era/
];
const endBlocklist = [
    "more from", //  https://blog.bradfieldcs.com/you-are-not-google-84912cf44afb
    "subscribe", // https://axie.substack.com/p/funding
    "related", // https://stackoverflow.blog/2022/04/07/you-should-be-reading-academic-computer-science-papers/
    "comments", // https://www.bennadel.com/blog/4210-you-can-throw-anything-in-javascript-and-other-async-await-considerations.htm
];
const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
];

export function getOutline(): [OutlineItem[], number] {
    // List raw DOM nodes and filter to likely headings
    const headingItems = getHeadingItems();
    if (headingItems.length === 0) {
        return [null, 0];
    }

    // Construct hierarchy based on heading level
    const collapsedItems = collapseItems(headingItems);

    // Normalize root
    let outlineRoot: OutlineItem;
    if (collapsedItems[0].children.length === 1) {
        // only one site headings root, use that directly
        outlineRoot = collapsedItems[0].children[0];
    } else {
        // Use manually added root
        outlineRoot = collapsedItems[0];

        // Check if first child duplicates title
        // e.g. https://blog.adamchalmers.com/making-a-dns-client
        if (outlineRoot.title.includes(outlineRoot.children?.[0].title)) {
            // check include() and use explicit title if available in case meta title includes more noise
            outlineRoot.title = outlineRoot.children?.[0].title;
            outlineRoot.children = outlineRoot.children?.[0].children.concat(
                outlineRoot.children.slice(1)
            );
        }
    }

    const normalizedOutline = normalizeItemLevel(outlineRoot, 0);

    // put title on same level as main headings
    const squashedOutline = [{ ...normalizedOutline, children: [] }].concat(
        normalizedOutline.children
    );

    return [squashedOutline, headingItems.length];
}

function getHeadingItems(): OutlineItem[] {
    const outline: OutlineItem[] = [];

    // Get all heading elements from DOM in one go to keep serial order
    const nodes = document.body.querySelectorAll(
        "h1, h2, h3, h4, .dropcap, .has-dropcap, p[class*=dropcap], strong, b"
    );

    // h4, h5, h6 often used for side content or tagging, so ignore them
    // e.g. https://www.quantamagazine.org/researchers-identify-master-problem-underlying-all-cryptography-20220406/

    let index = 0;
    for (const node of nodes) {
        // Ignore invisible or removed elements
        if (node.offsetHeight === 0) {
            continue;
        }

        // determine which heading element matched
        let headingItem: OutlineItem;
        if (node.tagName.length === 2 && node.tagName[0] == "H") {
            headingItem = getHeadingNodeItem(node);
        } else if (node.className.includes("dropcap")) {
            headingItem = getDropcapNodeItem(node);
        } else if (node.tagName === "STRONG" || node.tagName === "B") {
            headingItem = getSoftNodeItem(node);
        }

        if (!headingItem) {
            continue;
        }

        outline.push({
            ...headingItem,
            index,
        });
        index += 1;
    }

    return outline;
}

function getHeadingNodeItem(node: Element): OutlineItem | null {
    // Ignore specific words & css classes
    const text = node.textContent;
    if (
        contentBlocklist
            .concat(monthNames)
            .some((word) => text.toLowerCase().includes(word))
    ) {
        return;
    }
    if (
        asideWordBlocklist
            .filter((word) => !["header", "ad"].includes(word))
            .concat(classBlocklist)
            .some(
                (word) =>
                    node.className.toLowerCase().includes(word) ||
                    node.id.toLowerCase().includes(word) ||
                    node.parentElement.className.toLowerCase().includes(word)
            )
    ) {
        return;
    }
    if (endBlocklist.some((word) => text.toLowerCase().includes(word))) {
        return;
    }
    if (node.parentElement.tagName === "A") {
        // often related link, e.g. https://www.worksinprogress.co/issue/womb-for-improvement/
        return;
    }

    // Clean heading text
    let cleanText = text.trim().split("\n").pop();
    cleanText = cleanText.replace("#", "").replace("[edit]", "");
    while (cleanText.includes("  ")) {
        cleanText = cleanText.replace(/  /g, " ");
    }
    if (cleanText === "") {
        return;
    }

    // Construct hierarchy based on <hX> level
    const level = parseInt(node.tagName.slice(1));
    return {
        index: null, // populated above
        title: cleanText,
        level,
        element: node,
        children: [], // populated later
    };
}

// Paragraphs that highlight the first letter
// e.g. https://www.newyorker.com/magazine/2022/04/11/the-unravelling-of-an-expert-on-serial-killers
function getDropcapNodeItem(node: Element): OutlineItem | null {
    if (node.textContent.length < 5) {
        // dropcap class applied to single letter, e.g. https://nautil.us/the-power-of-narrative-15975/
        node = node.parentNode as Element;
    }

    return {
        index: null, // populated abov
        title: restrictTitleLength(node.textContent),
        level: 10,
        element: node,
        children: [], // populated below
    };
}

// <b> or <strong> used as headlines
// e.g. https://waitbutwhy.com/2014/10/religion-for-the-nonreligious.html
function getSoftNodeItem(node: Element): OutlineItem | null {
    if (!node.textContent) {
        return;
    }

    // easier to match for true headings than to exclude non-matches here
    let isHeading = false;

    if (
        node.parentElement.childNodes.length === 1 &&
        node.parentElement.tagName === "P"
    ) {
        // single child of <p>
        // e.g. https://www.cadosecurity.com/cado-discovers-denonia-the-first-malware-specifically-targeting-lambda/
        isHeading = true;
    } else if (
        node.parentElement.childNodes.length === 1 &&
        node.parentElement.parentElement.childNodes.length === 1 &&
        node.parentElement.parentElement.tagName === "P"
    ) {
        // single child of single child of <p>
        // e.g. https://waitbutwhy.com/2014/10/religion-for-the-nonreligious.html
        isHeading = true;
    }

    if (!isHeading) {
        return;
    }

    // infer heading level from font size (the larger the lower the level)
    // e.g. for https://waitbutwhy.com/2014/10/religion-for-the-nonreligious.html
    const fontSizeLevel =
        100 -
        parseInt(window.getComputedStyle(node).fontSize.replace("px", ""));
    // but keep them within bounds (explicit heading rank higher, dropcaps lower)
    const level = parseFloat(`8.${fontSizeLevel}`);

    return {
        index: null, // populated abov
        title: restrictTitleLength(node.textContent),
        level,
        element: node,
        children: [], // populated below
    };
}

function restrictTitleLength(title: string, maxLength: number = 29): string {
    const words = title.slice(0, maxLength + 10).split(" ");

    let length = 0;
    const wordsInRange = [];
    for (const word of words) {
        if (length + word.length > maxLength) {
            break;
        }
        wordsInRange.push(word);
        length += word.length;
    }

    return wordsInRange.join(" ");
}

function collapseItems(headingItems: OutlineItem[]): OutlineItem[] {
    const currentStack: OutlineItem[] = [
        {
            index: -1,
            level: 0,
            title: document.title,
            element: document.body,
            children: [],
        },
    ];
    for (const item of headingItems) {
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

    return currentStack;
}

function normalizeItemLevel(
    item: OutlineItem,
    currentLevel: number = 0
): OutlineItem {
    return {
        ...item,
        level: currentLevel,
        children: item.children.map((child) =>
            normalizeItemLevel(child, currentLevel + 1)
        ),
    };
}

export function addHeadingIds(flatOutline: OutlineItem[]) {
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
