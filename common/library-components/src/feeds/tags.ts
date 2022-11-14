import { getDomain } from "../common";

// extract article tags from the page
export function extractTags(document: Document, sourceUrl: string): string[] {
    const sourceDomain = getDomain(sourceUrl);
    const documentRect = document.documentElement.getBoundingClientRect();

    // user-browsable tags should always be links
    const candidates: HTMLAnchorElement[] = [];
    document.querySelectorAll("a[href]").forEach((node: HTMLAnchorElement) => {
        // allow invisible nodes in case hidden by aggressive uncluttering
        // if (node.offsetHeight === 0) {
        //     return false;
        // }

        // url-based filters
        const url = new URL(node.href);
        if (
            getDomain(node.href) !== sourceDomain ||
            url.pathname === "/" ||
            url.pathname === new URL(sourceUrl).pathname ||
            url.hash ||
            url.pathname.split("/").length > 4 || // /archive/opinion/
            url.pathname.length > 30
        ) {
            return;
        }
        if (blockList.some((word) => url.pathname.toLowerCase().includes(word))) {
            return;
        }

        // text-based filters
        if (node.innerText.length < 3 || node.innerText.split(" ").length > 4) {
            // "a reporter at large" on https://www.newyorker.com/magazine/1994/01/10/e-mail-from-bill
            return;
        }

        // position-based filters
        const rect = node.getBoundingClientRect();
        if (rect.top <= 100 || rect.top >= documentRect.bottom - 500) {
            return;
        }
        // TODO check against viewport?

        candidates.push(node);
    });

    return candidates.map((n) => n.href);
}

function cleanTag(tag: string): string {
    return tag
        .replace(/[^a-z0-9]/gi, "")
        .trim()
        .toLowerCase();
}

const blockList = [
    "careers",
    "contact",
    "about",
    "faq",
    "terms",
    "privacy",
    "advert",
    "preferences",
    "feedback",
    "info",
    "browse",
    "howto",
    "account",
    "subscribe",
    "donate",
    "shop",
    "admin",
];
