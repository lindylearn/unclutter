import clsx from "clsx";
import debounce from "lodash/debounce";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { LindyAnnotation } from "../../common/annotations/create";
import { deleteAnnotation, updateAnnotation } from "../common/CRUD";
import { SidebarContext } from "../context";

export interface AnnotationDraftProps {
    annotation: LindyAnnotation;
    className?: string;
    heightLimitPx?: number;
    isFetching?: boolean;
    relatedCount?: number;

    color: string;
    colorDark?: string;

    unfocusAnnotation: () => void;
}

export default function AnnotationDraft({
    annotation,
    className,
    heightLimitPx,
    isFetching,
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
    const [localAnnotation, setLocalAnnotation] = React.useState(annotation);
    async function updateAnnotationLocalFirst(newAnnotation: LindyAnnotation) {
        setLocalAnnotation(newAnnotation);

        if (!!annotation.text !== !!newAnnotation.text) {
            // changed visiblity
            // immediately update if added first text or removed text (impacts visibility)
            if (newAnnotation.text) {
                updateAnnotation(newAnnotation);
            } else {
                deleteAnnotation(userInfo, newAnnotation);
            }
        } else {
            // call with newAnnotation as localAnnotation takes once loop iteration to update
            await debouncedUpdateApi(newAnnotation);
        }
    }

    return (
        <div
            className={clsx(
                `annotation annotation-draft relative flex flex-col gap-2 rounded-l-sm rounded-r-md p-2 px-3 text-sm shadow`,
                annotation.focused && "focused",
                className
            )}
            style={{
                borderLeft: `8px solid ${color}`,
                // @ts-ignore
                "--dark-border-color": colorDark || color,
                maxHeight: heightLimitPx,
            }}
            // ref={ref}
        >
            <TextareaAutosize
                className="w-full select-none resize-none overflow-hidden bg-transparent align-top outline-none placeholder:select-none placeholder:text-stone-400 placeholder:opacity-50 dark:placeholder:text-stone-600"
                placeholder={
                    isFetching
                        ? ""
                        : relatedCount
                        ? `${relatedCount} related highlight${relatedCount !== 1 ? "s" : ""}`
                        : "Saved highlight"
                }
                value={localAnnotation.text}
                onChange={(e) =>
                    updateAnnotationLocalFirst({
                        ...localAnnotation,
                        text: e.target.value,
                    })
                }
                onKeyDown={(e) => {
                    if (!localAnnotation.text && (e.key === "Backspace" || e.key === "Delete")) {
                        deleteAnnotation(userInfo, localAnnotation);
                    }
                }}
                minRows={1}
                maxRows={6}
                spellCheck={false}
                ref={inputRef}
                onBlur={unfocusAnnotation}
            />

            {isFetching && <div className="loader absolute top-2 right-2 flex h-4 w-4 gap-2"></div>}
        </div>
    );
}

export function useBlurRef(annotation: LindyAnnotation, unfocusAnnotation: () => void) {
    // if annotation focused, detect clicks to unfocus it
    const ref = useRef<HTMLDivElement>();
    useEffect(() => {
        if (annotation.focused) {
            const onClick = (e) => {
                const clickTarget: HTMLElement = e.target;

                // ignore actions performed on other annotations (e.g. deletes)
                if (
                    clickTarget?.classList.contains("annotation") ||
                    clickTarget?.parentElement?.classList.contains("annotation")
                ) {
                    return;
                }

                if (ref.current && !ref.current.contains(clickTarget)) {
                    unfocusAnnotation();
                }
            };

            document.addEventListener("click", onClick, true);
            window.addEventListener("blur", onClick, true);

            return () => {
                document.removeEventListener("click", onClick, true);
                window.removeEventListener("blur", onClick, true);
            };
        }
    }, [annotation.focused]);

    return ref;
}
