import clsx from "clsx";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { deleteAnnotation, updateAnnotation } from "../common/CRUD";
import { SidebarContext } from "../context";
import { AnnotationDraftProps, useBlurRef } from "./AnnotationDraft";
import { copyTextToClipboard } from "@unclutter/library-components/dist/common/util";

export default function AnnotationDraftNew({
    annotation,
    className,
    heightLimitPx,
    isFetching,
    relatedCount,
    color,
    colorDark,
    unfocusAnnotation,
}: AnnotationDraftProps) {
    const ref = useBlurRef(annotation, unfocusAnnotation);
    const { userInfo } = useContext(SidebarContext);

    // focus on initial render
    useEffect(() => {
        if (annotation.focused) {
            ref.current?.focus();
        }
    }, [ref, annotation.focused]);

    // debounce local state and remote updates
    // debounce instead of throttle so that newest call eventually runs
    // @ts-ignore
    // const debouncedUpdateApi: (annotation: LindyAnnotation) => Promise<LindyAnnotation> =
    //     useCallback(
    //         debounce((a) => {
    //             updateAnnotation(a);
    //         }, 1000),
    //         []
    //     );

    // keep local state for faster updates
    const localAnnotation = annotation;
    // const [localAnnotation, setLocalAnnotation] = React.useState(annotation);
    // async function updateAnnotationLocalFirst(newAnnotation: LindyAnnotation) {
    //     setLocalAnnotation(newAnnotation);

    //     if (!!annotation.text !== !!newAnnotation.text) {
    //         // changed visiblity
    //         // immediately update if added first text or removed text (impacts visibility)
    //         if (newAnnotation.text) {
    //             updateAnnotation(newAnnotation);
    //         } else {
    //             deleteAnnotation(userInfo, newAnnotation);
    //         }
    //     } else {
    //         // call with newAnnotation as localAnnotation takes once loop iteration to update
    //         await debouncedUpdateApi(newAnnotation);
    //     }
    // }

    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <div
            className={clsx(
                `annotation annotation-draft relative flex min-h-[33.750px] items-center rounded-l-sm rounded-r-md p-2 pl-3 text-sm shadow`,
                annotation.focused && "focused",
                className
            )}
            style={{
                borderLeft: `8px solid ${color}`,
                // @ts-ignore
                "--dark-border-color": colorDark || color,
                maxHeight: heightLimitPx,
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen(true);
            }}
            ref={ref}
        >
            {isFetching && !localAnnotation.tags?.length ? (
                <div className="loader absolute left-3 h-4 w-4" />
            ) : (
                <></>
            )}

            <div className="flex flex-grow gap-2 overflow-hidden">
                {localAnnotation.tags?.slice(0, 2).map((tag, i) => (
                    <div
                        className={clsx(
                            "annotation-tag shrink cursor-pointer overflow-ellipsis whitespace-nowrap text-center font-medium transition-all hover:scale-[98%]"
                        )}
                        style={{
                            animationDelay: `${i * 50}ms`,
                            // @ts-ignore
                            // "--hover-color": getRandomColor(tag),
                        }}
                        onClick={() => openLibrary("quotes", tag)}
                    >
                        #{tag}
                    </div>
                ))}
            </div>
            {/* {Math.ceil(seedrandom(tag)() * 10)} */}
            {/* <AnimatedNumber value={Math.ceil(seedrandom(tag)() * 10)} diff={1} /> */}
            <div className="flex gap-3 text-stone-400 dark:text-stone-600">
                <svg
                    className="h-4 cursor-pointer transition-all hover:scale-[95%]"
                    viewBox="0 0 512 512"
                    onClick={() => copyTextToClipboard(`"${annotation.quote_text}"`)}
                >
                    <path
                        fill="currentColor"
                        d="M502.6 70.63l-61.25-61.25C435.4 3.371 427.2 0 418.7 0H255.1c-35.35 0-64 28.66-64 64l.0195 256C192 355.4 220.7 384 256 384h192c35.2 0 64-28.8 64-64V93.25C512 84.77 508.6 76.63 502.6 70.63zM464 320c0 8.836-7.164 16-16 16H255.1c-8.838 0-16-7.164-16-16L239.1 64.13c0-8.836 7.164-16 16-16h128L384 96c0 17.67 14.33 32 32 32h47.1V320zM272 448c0 8.836-7.164 16-16 16H63.1c-8.838 0-16-7.164-16-16L47.98 192.1c0-8.836 7.164-16 16-16H160V128H63.99c-35.35 0-64 28.65-64 64l.0098 256C.002 483.3 28.66 512 64 512h192c35.2 0 64-28.8 64-64v-32h-47.1L272 448z"
                    />
                </svg>
                <svg
                    className="h-4 cursor-pointer transition-all hover:scale-[95%]"
                    viewBox="0 0 576 512"
                    onClick={() => deleteAnnotation(userInfo, annotation)}
                >
                    <path
                        fill="currentColor"
                        d="M424 80C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H412.4L388.4 452.7C385.9 486.1 358.1 512 324.6 512H123.4C89.92 512 62.09 486.1 59.61 452.7L35.56 128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94L354.2 80H424zM177.1 48C174.5 48 171.1 49.34 170.5 51.56L151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1zM364.3 128H83.69L107.5 449.2C108.1 457.5 115.1 464 123.4 464H324.6C332.9 464 339.9 457.5 340.5 449.2L364.3 128z"
                    />
                </svg>
            </div>
        </div>
    );
}

function openLibrary(initialTab: string, initialTagFilter?: string) {
    window.top?.postMessage(
        {
            event: "showModal",
            initialTab,
            initialTagFilter,
        },
        "*"
    );
}
