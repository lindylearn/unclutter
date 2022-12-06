import clsx from "clsx";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { LindyAnnotation } from "../../common/annotations/create";
import { getAnnotationColor } from "../../common/annotations/styling";
import { updateAnnotation as updateAnnotationApi } from "../common/CRUD";
import { useBlurRef } from "./Annotation";

interface AnnotationDraftProps {
    annotation: LindyAnnotation;
    className?: string;
    heightLimitPx?: number;
    showingReplies: boolean;
    isReply: boolean;

    hypothesisSyncEnabled: boolean;
    deleteHide: () => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    createReply: () => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
}

function AnnotationDraft({
    annotation,
    className,
    deleteHide,
    hypothesisSyncEnabled,
    isReply = false,
    heightLimitPx,
    updateAnnotation,
    onHoverUpdate,
    unfocusAnnotation,
}: AnnotationDraftProps) {
    const inputRef = useRef<HTMLTextAreaElement>();

    // focus on initial render
    useEffect(() => {
        if (annotation.focused) {
            inputRef.current?.focus();
        }
    }, [inputRef, annotation.focused]);

    const ref = useBlurRef(annotation, unfocusAnnotation);

    // debounce local state and remote updates
    // debounce instead of throttle so that newest call eventually runs
    const debouncedUpdateApi: (annotation: LindyAnnotation) => Promise<LindyAnnotation> =
        useCallback(
            debounce((a) => {
                updateAnnotation(a); // update app root state
                updateAnnotationApi(a);
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
                updateAnnotationApi(newAnnotation);
            } else {
                deleteHide();
            }
        } else {
            // call with newAnnotation as localAnnotation takes once loop iteration to update
            await debouncedUpdateApi(newAnnotation);
        }
    }

    const color = getAnnotationColor(annotation);

    return (
        <div
            className={clsx(
                `annotation relative rounded-l rounded-r-md bg-white p-1 pl-2 text-gray-800 shadow`,
                annotation.focused && "focused",
                className
            )}
            style={{
                // boxShadow: `-1.5px 0.5px 2px 0 ${color}`,
                borderLeft: `8px solid ${color}`,
                maxHeight: heightLimitPx,
            }}
            // onMouseEnter={() => onHoverUpdate(true)}
            // onMouseLeave={() => onHoverUpdate(false)}
            ref={ref}
        >
            <TextareaAutosize
                className="w-full select-none rounded-md bg-transparent p-1 align-top text-sm placeholder-gray-400 outline-none placeholder:select-none md:text-base"
                placeholder={
                    localAnnotation.listIndex === 0
                        ? "Copied quote. Press DELETE to delete the highlight."
                        : localAnnotation.listIndex === 1
                        ? "Highlight more to grow your library."
                        : ""
                }
                value={localAnnotation.text}
                onChange={(e) =>
                    updateAnnotationLocalFirst({
                        ...localAnnotation,
                        text: e.target.value,
                    })
                }
                onKeyDown={(e) => {
                    if ((e.key === "Backspace" || e.key === "Delete") && !localAnnotation.text) {
                        deleteHide();
                    }
                }}
                minRows={2}
                maxRows={5}
                ref={inputRef}
                onFocus={() => onHoverUpdate(true)}
                onBlur={() => onHoverUpdate(false)}
            />
        </div>
    );
}
export default AnnotationDraft;
