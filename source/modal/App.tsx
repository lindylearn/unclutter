import clsx from "clsx";
import React, { useEffect, useMemo, useReducer, useState } from "react";

export default function App({ darkModeEnabled = false }) {
    useEffect(() => {
        window.onmessage = ({ data }) => {};

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
                1
            </div>
        </div>
    );
}
