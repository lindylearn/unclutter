import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { LindyIcon } from "@unclutter/library-components/dist/components";

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
                console.log(2, data);
                setLibraryState(data.libraryState);
            }
        });

        // initial state set in messaging.ts
        setLibraryState(libraryState || window["libraryState"] || null);

        window.top.postMessage({ event: "modalAppReady" }, "*");
    }, []);

    // useEffect(async () => {
    //     if (rep) {
    //         const start = new Date();
    //         start.setDate(start.getDate() - 90);
    //         console.log(await rep.query.listRecentArticles(start));
    //     }
    // }, [rep]);

    function closeModal() {
        window.top.postMessage({ event: "closeLibraryModal" }, "*");
    }

    return (
        <div className="modal font-paragraph relative h-screen w-screen pt-5 text-base text-gray-700">
            <div
                className={clsx(
                    "modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out",
                    darkModeEnabled
                        ? "bg-[rgb(19,21,22)] opacity-50"
                        : "bg-stone-800 opacity-50"
                )}
                onClick={closeModal}
            />
            <div className="modal-content relative z-10 mx-auto h-4/6 w-4/6 rounded-lg p-5 shadow">
                <LindyIcon />
                {libraryState?.libraryInfo?.article.title}
            </div>
        </div>
    );
}
