import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { LibraryModalPage } from "@unclutter/library-components/dist/components/Modal";

import { LibraryState } from "../common/schema";
import { ReplicacheProxy } from "../content-script/messaging";

export default function App({
    darkModeEnabled = false,
}: {
    darkModeEnabled?: boolean;
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

    const articleUrl = null;

    return (
        <LibraryModalPage
            darkModeEnabled={darkModeEnabled}
            articleUrl={articleUrl}
        />
    );
}
