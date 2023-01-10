import clsx from "clsx";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { LindyAnnotation } from "../../common/annotations/create";
import { getAnnotationColor } from "../../common/annotations/styling";
import { updateAnnotation as updateAnnotationApi } from "../common/CRUD";

interface AnnotationDraftProps {
    annotation: LindyAnnotation;
    className?: string;
    heightLimitPx?: number;

    deleteHide: () => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
}

function AnnotationDraft({
    annotation,
    className,
    deleteHide,
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

    const [question, setQuestion] = useState<string>();
    // useEffect(() => {
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
    // }, []);

    return (
        <div
            className={clsx(
                `annotation annotation-draft relative flex flex-col gap-2 rounded-l rounded-r-md p-2 pl-3 text-sm shadow`,
                annotation.focused && "focused",
                className
            )}
            style={{
                borderLeft: `8px solid ${getAnnotationColor(annotation)}`,
                maxHeight: heightLimitPx,
            }}
            ref={ref}
        >
            <TextareaAutosize
                className="w-full select-none resize-none rounded-md bg-transparent align-top outline-none placeholder:select-none placeholder:text-stone-500 placeholder:opacity-50"
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
        </div>
    );
}
export default AnnotationDraft;

export function useBlurRef(
    annotation: LindyAnnotation,
    unfocusAnnotation: (annotation: LindyAnnotation) => void
) {
    // if annotation focused, detect clicks to unfocus it
    const ref = useRef<HTMLDivElement>();
    useEffect(() => {
        if (annotation.focused) {
            const onClick = (e) => {
                const clickTarget: HTMLElement = e.target;

                // ignore actions performed on other annotations (e.g. deletes)
                if (clickTarget.classList.contains("icon")) {
                    return;
                }

                if (ref.current && !ref.current.contains(clickTarget)) {
                    unfocusAnnotation(annotation);
                }
            };

            document.addEventListener("click", onClick, true);
            return () => {
                document.removeEventListener("click", onClick, true);
            };
        }
    }, [annotation.focused]);

    return ref;
}
