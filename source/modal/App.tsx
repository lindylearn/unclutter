import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { LibraryState } from "../common/schema";

export default function App({
    darkModeEnabled = false,
}: {
    darkModeEnabled?: boolean;
}) {
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

    function closeModal() {
        window.top.postMessage({ event: "closeLibraryModal" }, "*");
    }

    return (
        <div className="modal relative h-screen w-screen pt-5 font-paragraph text-base text-gray-700">
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
                {libraryState?.libraryInfo?.article.title}
            </div>
        </div>
    );
}
