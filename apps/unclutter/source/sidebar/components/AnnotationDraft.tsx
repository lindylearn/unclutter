import clsx from "clsx";
import ky from "ky";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { AnimatedNumber } from "@unclutter/library-components/dist/components";

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
    relatedCount?: number;

    hypothesisSyncEnabled: boolean;
    deleteHide: () => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    createReply: () => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
    showRelated?: () => void;
}

function AnnotationDraft({
    annotation,
    className,
    deleteHide,
    hypothesisSyncEnabled,
    isReply = false,
    relatedCount,
    heightLimitPx,
    updateAnnotation,
    onHoverUpdate,
    unfocusAnnotation,
    showRelated = () => {},
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

    const [question, setQuestion] = useState<string>();
    useEffect(() => {
        // if (!annotation.text) {
        //     ky.post("https://assistant-two.vercel.app/api/question", {
        //         json: {
        //             text: annotation.quote_text,
        //         },
        //     })
        //         .json()
        //         .then((question: any) => setQuestion(question));
        // }
        // if (!annotation.tags || annotation.tags.length === 0) {
        //     ky.post("https://assistant-two.vercel.app/api/tag", {
        //         json: {
        //             text: annotation.quote_text.replace("\n", " "),
        //         },
        //     })
        //         .json()
        //         .then((tags: any) => {
        //             updateAnnotationLocalFirst({
        //                 ...localAnnotation,
        //                 tags,
        //             });
        //         });
        // }
    }, []);

    return (
        <div
            className={clsx(
                `annotation annotation-draft relative flex flex-col gap-2 rounded-l rounded-r-md p-1 pl-2 text-sm text-gray-800 shadow`,
                annotation.focused && "focused",
                className
            )}
            style={{
                borderLeft: `8px solid ${color}`,
                maxHeight: heightLimitPx,
            }}
            ref={ref}
        >
            <TextareaAutosize
                className="w-full select-none resize-none rounded-md bg-transparent p-1 align-top outline-none placeholder:select-none placeholder:text-stone-400 placeholder:opacity-50"
                placeholder={question || "What to remember?"}
                // placeholder={localAnnotation.tags
                //     ?.slice(0, 3)
                //     .map((t) => `#${t.replace(" ", "-")}`)
                //     .join(" ")}
                value={localAnnotation.text}
                onChange={(e) =>
                    updateAnnotationLocalFirst({
                        ...localAnnotation,
                        text: e.target.value,
                    })
                }
                onKeyDown={(e) => {
                    if (!localAnnotation.text && (e.key === "Backspace" || e.key === "Delete")) {
                        deleteHide();
                    }
                    if (!localAnnotation.text && e.key === "Tab" && question) {
                        updateAnnotationLocalFirst({
                            ...localAnnotation,
                            text: question,
                        });
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                minRows={3}
                maxRows={6}
                ref={inputRef}
                onFocus={() => onHoverUpdate(true)}
                onBlur={() => onHoverUpdate(false)}
            />

            {/* <div className="mb-1 ml-1 flex min-h-[20px] gap-2 overflow-hidden text-xs text-stone-400 opacity-50">
                {localAnnotation.tags?.slice(0, 3).map((tag, i) => (
                    <div
                        className="annotation-tag flex shrink cursor-pointer gap-0.5 overflow-ellipsis whitespace-nowrap rounded-lg transition-all hover:scale-[98%]"
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        <div className="name">#{tag}</div>
                    </div>
                ))}
            </div> */}
            {/* {Math.ceil(seedrandom(tag)() * 10)} */}
            {/* <AnimatedNumber value={Math.ceil(seedrandom(tag)() * 10)} diff={1} /> */}

            {/* {relatedCount > 0 && (
                <div
                    className="flex cursor-pointer items-center gap-2 text-gray-400"
                    onMouseDown={(e) => {
                        showRelated();
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <svg className="w-4" viewBox="0 0 640 512">
                        <path
                            fill="currentColor"
                            d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                        />
                    </svg>
                    <span>{relatedCount} related notes</span>
                </div>
            )} */}
        </div>
    );
}
export default AnnotationDraft;
