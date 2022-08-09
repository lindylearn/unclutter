import browser from "../common/polyfill";
import { Bookmarks } from "webextension-polyfill";

export function requestBookmarksPermission() {
    return browser.permissions.request({
        permissions: ["bookmarks"],
    });
}

export interface BookmarkedPage {
    url: string;
    time_added: number;
    favorite: boolean;
}

export async function getAllBookmarks(): Promise<BookmarkedPage[]> {
    const bookmarks: Bookmarks.BookmarkTreeNode[] =
        await browser.bookmarks.search({});

    return bookmarks
        .filter((b) => b.url !== undefined)
        .map((b) => ({
            url: b.url,
            time_added: Math.round(b.dateAdded / 1000),
            favorite: true,
        }));
}
