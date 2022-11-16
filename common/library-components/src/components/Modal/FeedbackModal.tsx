import React, { createContext, useContext, useEffect, useState } from "react";
import clsx from "clsx";

import { LindyIcon } from "../Icons";
import { ModalContext } from "..";

export function FeedbackModalPage({
    reportEvent = () => {},
}: {
    reportEvent?: (event: string, data?: any) => void;
}) {
    const { isVisible, closeModal } = useContext(ModalContext);

    return (
        <div
            className={clsx(
                "modal fixed top-0 left-0 h-screen w-screen text-base",
                isVisible && "modal-visible",
                isVisible === false && "modal-hidden"
            )}
        >
            <div
                className="modal-background absolute top-0 left-0 h-full w-full cursor-zoom-out bg-stone-800 opacity-50 dark:bg-[rgb(19,21,22)]"
                onClick={closeModal}
            />
            <div className="modal-content relative z-10 mx-auto mt-10 flex h-5/6 max-h-[700px] max-w-5xl flex-col overflow-hidden rounded-lg bg-white text-stone-800 shadow dark:bg-[#212121] dark:text-[rgb(232,230,227)]">
                <div
                    className="overflow-y-scroll p-4 px-8"
                    //  bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-400
                    // style={{
                    //     backgroundImage: "linear-gradient(120deg, var(--tw-gradient-stops))",
                    // }}
                >
                    <div className="mb-4 flex w-full items-center gap-4">
                        <LindyIcon className="w-12" />

                        <h1 className="font-title text-2xl font-bold">Unclutter Feedback</h1>
                    </div>

                    <iframe
                        src="https://tally.so/embed/npb6xB?alignLeft=1&hideTitle=1&transparentBackground=1"
                        width="100%"
                        height="1100px"
                        frameBorder="0"
                        marginHeight={0}
                        marginWidth={0}
                        className="animate-fadein"
                    />
                </div>
            </div>
        </div>
    );
}
