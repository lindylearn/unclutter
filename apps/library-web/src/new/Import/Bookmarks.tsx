import type { BookmarkedPage } from "@unclutter/library-components/dist/common";
import { useEffect } from "react";

export function BookmarksImportText({}) {
    return <div className="">Please click the Unclutter extension icon while on this page.</div>;
}

export function BookmarksImportButtons({ onError, startImport }) {
    useEffect(() => {
        const listener = (event: MessageEvent) => {
            if (event.data.event === "returnBrowserBookmarks") {
                const bookmarks: BookmarkedPage[] = event.data.bookmarks;
                const importData = {
                    urls: bookmarks.map(({ url }) => url),
                    time_added: bookmarks.map(({ time_added }) => time_added),
                    favorite: bookmarks.map(({ favorite }) => favorite),
                };

                startImport(importData);
            }
        };
        window.addEventListener("message", listener);
        return () => window.removeEventListener("message", listener);
    }, []);

    return <></>;
}
