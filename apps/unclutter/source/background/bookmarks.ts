import browser from "../common/polyfill";
import type { Bookmarks } from "webextension-polyfill";
import { getDomainFrom } from "../common/util";
import { BookmarkedPage } from "@unclutter/library-components/dist/common";

export function requestBookmarksPermission() {
    return browser.permissions.request({
        permissions: ["bookmarks"],
    });
}

const excludedDomains = ["mozilla.org", "support.mozilla.org"]; // ignore default bookmark on Firefox
export async function getAllBookmarks(): Promise<BookmarkedPage[]> {
    const bookmarks: Bookmarks.BookmarkTreeNode[] = await browser.bookmarks.search({});

    return bookmarks
        .filter(
            (b) => b.url !== undefined && !excludedDomains.includes(getDomainFrom(new URL(b.url)))
        )
        .map((b) => ({
            url: b.url,
            time_added: Math.round(b.dateAdded / 1000),
            favorite: false,
        }));
}
