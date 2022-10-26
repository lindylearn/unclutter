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

    // keep local state
    const [localAnnotation, setLocalAnnotation] = React.useState(annotation);
    // patch correct id once annotation remotely created
    useEffect(() => {
        if (!localAnnotation.id && annotation.id) {
            const newAnnotation = { ...localAnnotation, id: annotation.id };
            setLocalAnnotation(newAnnotation);

            // synchronize potential local edits
            debouncedUpdateApi(newAnnotation);
        }
    }, [annotation.id]);
    async function updateAnnotationLocalFirst(newAnnotation: LindyAnnotation) {
        setLocalAnnotation(newAnnotation);

        if (!newAnnotation.id) {
            // synchronized once remotely created above
            return;
        }

        if (!!annotation.text !== !!newAnnotation.text) {
            // immediately update if added first text or removed text (impacts visibility)
            updateAnnotation(newAnnotation);
            updateAnnotationApi(newAnnotation);
        } else {
            // call with newAnnotation as localAnnotation takes once loop iteration to update
            await debouncedUpdateApi(newAnnotation);
        }
    }

    // show confirm step if annotation has text
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    function deleteWithConfirmStep() {
        if (localAnnotation.text && !showDeleteConfirmation) {
            setShowDeleteConfirmation(true);
            return;
        }

        deleteHide();
    }

    const color = getAnnotationColor(annotation);

    return (
        <div
            className={clsx(
                `annotation relative rounded-l rounded-r-md bg-white p-1 pl-1.5 text-gray-800 shadow transition-all hover:shadow-md`,
                annotation.focused && "focused",
                className
            )}
            style={{
                // boxShadow: `-1.5px 0.5px 2px 0 ${color}`,
                borderLeft: `8px solid ${color}`,
                maxHeight: heightLimitPx,
            }}
            onMouseEnter={() => onHoverUpdate(true)}
            onMouseLeave={() => onHoverUpdate(false)}
            ref={ref}
        >
            <TextareaAutosize
                className="w-full select-none rounded-md py-1 pl-2 pr-6 align-top text-sm placeholder-gray-400 outline-none placeholder:select-none md:text-base"
                placeholder={"Note"}
                value={localAnnotation.text}
                onChange={(e) =>
                    updateAnnotationLocalFirst({
                        ...localAnnotation,
                        text: e.target.value,
                    })
                }
                minRows={2}
                maxRows={5}
                ref={inputRef}
                onFocus={() => onHoverUpdate(true)}
                onBlur={() => onHoverUpdate(false)}
            />
            {/* <div className="top-icons absolute top-1.5 right-1.5 flex gap-2 p-1 text-gray-400">
                <div
                    className="lindy-tooltp lindy-fade cursor-pointer transition-all hover:text-gray-600 hover:drop-shadow-md"
                    onClick={deleteWithConfirmStep}
                    data-title={
                        showDeleteConfirmation ? "Click again to confirm" : "Delete annotation"
                    }
                    onMouseLeave={() =>
                        // timout to fade-out tooltip first
                        setTimeout(() => setShowDeleteConfirmation(false), 200)
                    }
                >
                    <svg className="icon h-3.5" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M424 80C437.3 80 448 90.75 448 104C448 117.3 437.3 128 424 128H412.4L388.4 452.7C385.9 486.1 358.1 512 324.6 512H123.4C89.92 512 62.09 486.1 59.61 452.7L35.56 128H24C10.75 128 0 117.3 0 104C0 90.75 10.75 80 24 80H93.82L130.5 24.94C140.9 9.357 158.4 0 177.1 0H270.9C289.6 0 307.1 9.358 317.5 24.94L354.2 80H424zM177.1 48C174.5 48 171.1 49.34 170.5 51.56L151.5 80H296.5L277.5 51.56C276 49.34 273.5 48 270.9 48H177.1zM364.3 128H83.69L107.5 449.2C108.1 457.5 115.1 464 123.4 464H324.6C332.9 464 339.9 457.5 340.5 449.2L364.3 128z"
                        />
                    </svg>
                </div>
            </div> */}
        </div>
    );
}
export default AnnotationDraft;
