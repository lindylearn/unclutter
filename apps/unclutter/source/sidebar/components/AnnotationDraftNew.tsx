import clsx from "clsx";
import debounce from "lodash/debounce";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";

import { LindyAnnotation } from "../../common/annotations/create";
import { deleteAnnotation, updateAnnotation } from "../common/CRUD";
import { SidebarContext } from "../context";
import { AnnotationDraftProps } from "./AnnotationDraft";
import { getRandomColor } from "@unclutter/library-components/dist/common/styling";
import { HighlightDropdown } from "@unclutter/library-components/dist/components/Dropdown/HighlightDowndown";

export default function AnnotationDraftNew({
    annotation,
    className,
    heightLimitPx,
    isFetchingRelated,
    relatedCount,
    color,
    colorDark,
    unfocusAnnotation,
}: AnnotationDraftProps) {
    // const ref = useBlurRef(annotation, unfocusAnnotation);
    const inputRef = useRef<HTMLTextAreaElement>();
    const { userInfo } = useContext(SidebarContext);

    // focus on initial render
    useEffect(() => {
        if (annotation.focused) {
            inputRef.current?.focus();
        }
    }, [inputRef, annotation.focused]);

    // debounce local state and remote updates
    // debounce instead of throttle so that newest call eventually runs
    // @ts-ignore
    const debouncedUpdateApi: (annotation: LindyAnnotation) => Promise<LindyAnnotation> =
        useCallback(
            debounce((a) => {
                updateAnnotation(a);
            }, 1000),
            []
        );

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

    // const keyboardListenerRef = useRef<(e: KeyboardEvent) => void>();
    // useEffect(() => {
    //     if (!annotation.focused) {
    //         if (keyboardListenerRef.current) {
    //             document.removeEventListener("keydown", keyboardListenerRef.current);
    //         }
    //         keyboardListenerRef.current = undefined;
    //         return;
    //     }

    //     keyboardListenerRef.current = (e: KeyboardEvent) => {
    //         console.log(e)
    //         if (e.key === "Escape") {
    //             unfocusAnnotation();
    //         } else if (e.key === "Delete") {
    //             deleteAnnotation(userInfo, annotation);
    //         }
    //     };
    //     document.addEventListener("keydown", keyboardListenerRef.current);

    //     return () => {
    //         document.removeEventListener("keydown", keyboardListenerRef.current);
    //     };
    // }, [annotation.focused]);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <div
            className={clsx(
                `annotation annotation-draft relative rounded-l-sm rounded-r-md text-sm shadow`,
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
            // ref={ref}
        >
            <div className="flex min-h-[33.750px] overflow-hidden">
                {localAnnotation.tags?.slice(0, 3).map((tag, i) => (
                    <div
                        className={clsx(
                            "font-title annotation-tag flex shrink cursor-pointer gap-0.5 overflow-ellipsis whitespace-nowrap py-2 px-1 transition-all hover:scale-[98%]",
                            i === 0 && "pl-3"
                        )}
                        style={{
                            animationDelay: `${i * 50}ms`,
                            // backgroundColor: color, // getRandomColor(tag),
                        }}
                    >
                        <div className="name">#{tag}</div>
                    </div>
                ))}
            </div>
            {/* {Math.ceil(seedrandom(tag)() * 10)} */}
            {/* <AnimatedNumber value={Math.ceil(seedrandom(tag)() * 10)} diff={1} /> */}

            {/* {isFetchingRelated && (
                <div className="loader absolute top-2 right-2 flex h-4 w-4 gap-2"></div>
            )} */}

            <HighlightDropdown
                // @ts-ignore
                annotation={annotation}
                open={dropdownOpen}
                setOpen={setDropdownOpen}
            />
        </div>
    );
}
