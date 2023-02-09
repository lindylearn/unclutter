import clsx from "clsx";
import debounce from "lodash/debounce";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import ky from "ky";

import { LindyAnnotation } from "../../common/annotations/create";
import { deleteAnnotation, updateAnnotation } from "../common/CRUD";
import { SidebarContext } from "../context";
import { AnnotationDraftProps } from "./AnnotationDraft";

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

    // const [question, setQuestion] = useState<string>();
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
        if (!annotation.tags || annotation.tags.length === 0) {
            console.log("fetching tags");
            ky.post("https://assistant-two.vercel.app/api/tag", {
                json: {
                    text: annotation.quote_text.replace("\n", " "),
                },
            })
                .json()
                .then((tags: any) => {
                    updateAnnotationLocalFirst({
                        ...localAnnotation,
                        tags,
                    });
                });
        }
    }, []);

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
            {/* {isFetchingRelated && (
                <div className="loader absolute top-2 right-2 flex h-4 w-4 gap-2"></div>
            )} */}

            <div className="flex min-h-[20px] gap-2 overflow-hidden">
                {localAnnotation.tags
                    ?.slice(0, 3)
                    .map((t) => t.replace(" ", "-"))
                    .slice(0, 3)
                    .map((tag, i) => (
                        <div
                            className="annotation-tag flex shrink cursor-pointer gap-0.5 overflow-ellipsis whitespace-nowrap rounded-lg transition-all hover:scale-[98%]"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="name">#{tag}</div>
                        </div>
                    ))}

                {/* <div>Share</div> */}
            </div>
            {/* {Math.ceil(seedrandom(tag)() * 10)} */}
            {/* <AnimatedNumber value={Math.ceil(seedrandom(tag)() * 10)} diff={1} /> */}
        </div>
    );
}
