import { useEffect } from "react";

export function BookmarksImportText({}) {
    return <div className="">Please click the Unclutter extension icon while on this page.</div>;
}

export function BookmarksImportButtons({ onError, startImport }) {
    useEffect(() => {
        const listener = (event: MessageEvent) => {
            if (event.data.event === "returnBrowserBookmarks") {
                startImport(event.data.bookmarks);
            }
        };
        window.addEventListener("message", listener);
        return () => window.removeEventListener("message", listener);
    }, []);

    return <></>;
}
