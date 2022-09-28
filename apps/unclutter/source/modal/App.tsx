import React, { useEffect, useMemo, useState } from "react";
import { LibraryModalPage } from "@unclutter/library-components/dist/components/Modal";

import { LibraryState } from "../common/schema";
import { ReplicacheProxy } from "../content-script/messaging";
import { ReplicacheContext } from "@unclutter/library-components/dist/store";

export default function App({
    darkModeEnabled,
    articleUrl,
}: {
    darkModeEnabled: string;
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

    const [showModal, setShowModal] = useState(false);
    useEffect(() => {
        // render once before triggering animation
        setShowModal(true);
    }, []);
    function closeModal() {
        // play out-animation before destroying iframe
        setShowModal(false);
        setTimeout(() => {
            window.top.postMessage({ event: "closeLibraryModal" }, "*");
        }, 300);
    }

    return (
        // @ts-ignore
        <ReplicacheContext.Provider value={rep}>
            <LibraryModalPage
                darkModeEnabled={darkModeEnabled === "true"} // convert string to bool
                articleUrl={
                    libraryState?.libraryInfo?.article.url || articleUrl
                }
                isVisible={showModal}
                closeModal={closeModal}
            />
        </ReplicacheContext.Provider>
    );
}
