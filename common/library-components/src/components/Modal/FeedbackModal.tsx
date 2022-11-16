import React, { useContext, useEffect } from "react";
import IframeResizer from 'iframe-resizer-react'
import clsx from "clsx";

import { LindyIcon } from "../Icons";
import { ModalContext } from "..";

export function FeedbackModalPage({
    onSubmit,
    reportEvent = () => {},
}: {
    onSubmit: () => void,
    reportEvent?: (event: string, data?: any) => void;
}) {
    const { isVisible, closeModal } = useContext(ModalContext);

    useEffect(() => {
        window.addEventListener('message', function (e: any) {
            try {
                const data = JSON.parse(e.data);
                if (data.event === 'Tally.FormSubmitted') {
                    onSubmit();
                    reportEvent('submitFeedbackForm');
                }
            } catch {}
        });
    }, [])

    useEffect(() => {
        if (isVisible) {
            reportEvent('openFeedbackModal');
        }
    }, [isVisible])

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
            <div className="modal-content o relative z-10 mx-auto mt-10 flex h-5/6 max-h-[700px] max-w-5xl flex-col overflow-hidden rounded-lg bg-white text-stone-800 shadow">
                <div
                    className="p-4 px-8 overflow-auto"
                    //  bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-400
                    // style={{
                    //     backgroundImage: "linear-gradient(120deg, var(--tw-gradient-stops))",
                    // }}
                >
                    <div className="mb-4 flex w-full items-center gap-4">
                        <LindyIcon className="w-12" />

                        <h1 className="font-title text-2xl font-bold">Unclutter Feedback</h1>
                    </div>

                    <IframeResizer
                        src="https://unclutter.lindylearn.io/feedback.html"
                        // src="http://localhost:3000/feedback.html"
                        style={{ width: '1px', minWidth: '100%'}}
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
