import { scrollToElement } from "./common";

export interface OutlineItem {
    index: number;
    title: string;
    level: number;
    element: Element;
    children: OutlineItem[];
    myAnnotationCount?: number;
    socialCommentsCount?: number;
}

const contentBlocklist = [
    "responses", // https://blog.bradfieldcs.com/you-are-not-google-84912cf44afb
    "top stories",
    "advertisement",
    "most read",
    "newsletter",
    "tags",
    "subscribe", // https://guzey.com/theses-on-sleep/
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
    "teaser", // https://www.vulture.com/article/joss-whedon-allegations.html
];
const endBlocklist = [
    "more from", //  https://blog.bradfieldcs.com/you-are-not-google-84912cf44afb
    "read next", // https://www.propublica.org/article/filing-taxes-could-be-free-simple-hr-block-intuit-lobbying-against-it
    "subscribe", // https://axie.substack.com/p/funding
    "related", // https://stackoverflow.blog/2022/04/07/you-should-be-reading-academic-computer-science-papers/
    "comments", // https://www.bennadel.com/blog/4210-you-can-throw-anything-in-javascript-and-other-async-await-considerations.htm
    "share this", // https://arstechnica.com/science/2022/05/rocket-report-starliner-soars-into-orbit-about-those-raptor-ruds-in-texas/
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

export function getOutline(): OutlineItem[] {
    // List raw DOM nodes and filter to likely headings
    const headingItems = getHeadingItems();
    const filteredHeadings = headingItems; // filterWithDisplayOffsets(headingItems);
    if (filteredHeadings.length === 0) {
        return [];
    }

    // Construct hierarchy based on heading level
    const collapsedItems = collapseItems(filteredHeadings);

    // drop duplicated headings, collapse hierarchy
    let outlineRoot: OutlineItem = collapsedItems[0];
    let didChange = true;
    while (didChange) {
        didChange = false;

        // collapse until there are multiple children
        // e.g. https://www.npr.org/templates/story/story.php?storyId=129551459&t=1652963492929 uses two levels
        if (outlineRoot.children.length === 1) {
            outlineRoot = outlineRoot.children[0];
            didChange = true;
        }

        // drop headings similar to the title
        while (outlineRoot.title.includes(outlineRoot.children?.[0]?.title)) {
            // prepend children of removed element
            outlineRoot.children = outlineRoot.children?.[0].children.concat(
                outlineRoot.children.slice(1)
            );

            didChange = true;
        }
    }

    // set special heading properties
    outlineRoot.element = document.body;
    outlineRoot.index = -1;

    // insert placeholder "introduction" item
    outlineRoot.children = [
        {
            index: 0,
            level: 1,
            title: "Introduction",
            element: document.body,
            children: [],
        },
        ...outlineRoot.children,
    ];

    const normalizedOutline = normalizeItemLevel(outlineRoot, 0);

    // put title on same level as main headings
    const squashedOutline = [{ ...normalizedOutline, children: [] }].concat(
        normalizedOutline.children
    );

    return squashedOutline;
}

function getHeadingItems(): OutlineItem[] {
    const outline: OutlineItem[] = [];

    // Get all heading elements from DOM in one go to keep serial order
    const nodes = document.body.querySelectorAll(
        "h1, h2, h3, h4, .dropcap, .has-dropcap, p[class*=dropcap], p[class*=drop-cap], strong, b"
    );

    // h4, h5, h6 often used for side content or tagging, so ignore them
    // e.g. https://www.quantamagazine.org/researchers-identify-master-problem-underlying-all-cryptography-20220406/

    let index = 1;
    for (const node of nodes) {
        // Ignore invisible or removed elements
        if (node.offsetHeight === 0) {
            continue;
        }

        // determine which heading element matched
        let headingItem: OutlineItem;
        if (node.tagName.length === 2 && node.tagName[0] == "H") {
            headingItem = getHeadingNodeItem(node, index);
        } else if (
            node.className.includes("dropcap") ||
            node.className.includes("drop-cap")
        ) {
            headingItem = getDropcapNodeItem(node);
        } else if (node.tagName === "STRONG" || node.tagName === "B") {
            headingItem = getSoftNodeItem(node);
        }

        if (!headingItem) {
            continue;
        }

        const linkElem = (
            node.parentElement.tagName === "A"
                ? node.parentElement
                : node.firstElementChild
        ) as HTMLAnchorElement | null;
        if (linkElem?.tagName === "A") {
            // often related link, e.g. https://www.worksinprogress.co/issue/womb-for-improvement/, https://www.propublica.org/article/filing-taxes-could-be-free-simple-hr-block-intuit-lobbying-against-it

            if (linkElem.getAttribute("href").startsWith("#")) {
                // allow page-internal links, e.g. https://scripter.co/zero-html-validation-errors/#validation-ignores
            } else {
                continue;
            }
        }

        // blocklist non-headers
        if (
            contentBlocklist
                .concat(monthNames)
                .some((word) => headingItem.title.toLowerCase().includes(word))
        ) {
            continue;
        }
        // if (
        //     asideWordBlocklist
        //         .filter((word) => !["header", "ad"].includes(word))
        //         .concat(classBlocklist)
        //         .some(
        //             (word) =>
        //                 node.className.toLowerCase().includes(word) ||
        //                 node.id.toLowerCase().includes(word) ||
        //                 node.parentElement.className
        //                     .toLowerCase()
        //                     .includes(word)
        //         )
        // ) {
        //     continue;
        // }
        if (
            endBlocklist.some((word) =>
                headingItem.title.toLowerCase().includes(word)
            )
        ) {
            break;
        }
        // exclude numbers, e.g. https://www.henricodolfing.com/2019/06/project-failure-case-study-knight-capital.html
        if (headingItem.title.length < 5) {
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

function getHeadingNodeItem(
    node: Element,
    headingIndex: number
): OutlineItem | null {
    // Ignore specific words & css classes
    const text = node.textContent;
    if (text.startsWith("By ")) {
        // e.g. https://towardsdev.com/hexagonal-architecture-and-domain-driven-design-bc2525dbc05f
        return;
    }

    // Clean heading text
    let cleanText = cleanTitle(text).replace("#", "").replace("[edit]", "");
    if (cleanText === "") {
        return;
    }

    if (headingIndex !== 0) {
        // don't restrict title heading length (after cleanup)
        cleanText = restrictTitleLength(cleanText, 100);
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
function getDropcapNodeItem(
    node: Element,
    recursion: number = 0
): OutlineItem | null {
    let text = node.textContent; // only visible text

    if (node?.getAttribute("aria-hidden") === "true") {
        // duplicate styling node -- dropcap will be present somewhere else
        // e.g. https://www.theverge.com/2017/5/22/15673712/anker-battery-charger-amazon-empire-steven-yang-interview
        return;
    }
    if (text.length < 10) {
        // dropcap class applied to single letter, e.g. https://nautil.us/the-power-of-narrative-15975/

        if (recursion > 1) {
            return;
        }

        return getDropcapNodeItem(node.parentNode as Element, recursion + 1);
    }

    if (text[1].trim() === "") {
        // drop displayed space, e.g. on https://www.theverge.com/2017/5/22/15673712/anker-battery-charger-amazon-empire-steven-yang-interview
        text = text[0] + text.slice(2);
    }

    return {
        index: null, // populated abov
        title: restrictTitleLength(text),
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
    } else if (
        node.previousElementSibling?.tagName === "BR" &&
        node.nextElementSibling?.tagName === "BR"
    ) {
        // surrounded by <br />
        // e.g. http://www.paulgraham.com/ds.html
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
        title: restrictTitleLength(cleanTitle(node.textContent)),
        level,
        element: node,
        children: [], // populated below
    };
}

export function cleanTitle(title: string): string {
    title = title.trim().split("\n").pop();

    while (title.includes("  ")) {
        title = title.replace(/  /g, " ");
    }

    if (title.endsWith(":")) {
        title = title.slice(0, title.length - 1);
    }

    title = title.split("|")[0].split(" - ")[0].split("–")[0].trim();

    return title;
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
    const currentStack: OutlineItem[] = [createRootItem()];
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
export function createRootItem(): OutlineItem {
    return {
        index: -1,
        level: 0,
        title: cleanTitle(document.title),
        element: document.body,
        children: [],
    };
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

// const outlineItemMargin = 20; // min allowed space between headings (remove duplication)
// const outlineTrailingMargin = 100; // drop headings in last page section (often related articles)
// function filterWithDisplayOffsets(flatOutline: OutlineItem[]): OutlineItem[] {
//     let lastOffset = 0;
//     let documentHeight = document.documentElement.scrollHeight;
//     const filteredOutline = [];
//     for (const item of flatOutline) {
//         const offset = getElementYOffset(item.element);
//         // if (lastOffset + outlineItemMargin)

//         if (offset >= documentHeight - outlineTrailingMargin) {
//             break;
//         }

//         filteredOutline.push(item);

//         console.log(offset);
//     }

//     return filteredOutline;
// }

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
