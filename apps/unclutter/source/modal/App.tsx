import React, { useEffect, useMemo, useState } from "react";
import { LibraryModalPage } from "@unclutter/library-components/dist/components/Modal";

import { LibraryState } from "../common/schema";
import { ReplicacheProxy } from "../content-script/messaging";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";

export default function App({
    darkModeEnabled,
    articleUrl,
}: {
    darkModeEnabled: boolean;
    articleUrl: string;
}) {
    const rep = useMemo<ReplicacheProxy>(() => new ReplicacheProxy(), []);
    const [libraryState, setLibraryState] = useState<LibraryState | null>(null);
    useEffect(() => {
        window.addEventListener("message", ({ data }) => {
            if (data.event === "setLibraryState") {
                setLibraryState(data.libraryState);
            }
        });

        // initial state set in messaging.ts
        setLibraryState(libraryState || window["libraryState"] || null);

        window.top.postMessage({ event: "modalAppReady" }, "*");
    }, []);

    function closeModal() {
        window.top.postMessage({ event: "closeLibraryModal" }, "*");
    }

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <LibraryModalPage
                darkModeEnabled={darkModeEnabled}
                articleUrl={libraryState?.libraryInfo.article.url || articleUrl}
                closeModal={closeModal}
            />
        </ReplicacheContext.Provider>
    );
}
