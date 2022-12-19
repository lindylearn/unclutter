import React, { useEffect, useState } from "react";
import ky from "ky";
import { LindyAnnotation } from "../../common/annotations/create";
import Annotation, { useBlurRef } from "./Annotation";
import AnnotationDraft from "./AnnotationDraft";

const maxReplyNesting = 1;

interface AnnotationThreadProps {
    annotation: LindyAnnotation;
    heightLimitPx?: number;

    hypothesisSyncEnabled: boolean;
    deleteHideAnnotation: (annotation: LindyAnnotation, threadStart: LindyAnnotation) => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
    createReply: (parent: LindyAnnotation, threadStart: LindyAnnotation) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;

    replyLevel?: number;
}

function AnnotationThread(props: AnnotationThreadProps) {
    const replyLevel = props.replyLevel || 0;

    let Component = Annotation;
    if (props.annotation.isMyAnnotation) {
        Component = AnnotationDraft;
    } else if (props.annotation.platform === "info") {
        Component = AnnotationDraft;
    }

    const showReplies = false;
    // const spaceForReplies = props.heightLimitPx - 140;
    // const showReplies =
    //     props.annotation.platform === "h" &&
    //     replyLevel < maxReplyNesting &&
    //     spaceForReplies >= props.annotation.reply_count * 100;

    const ref = useBlurRef(props.annotation, props.unfocusAnnotation);

    // const [related, setRelated] = useState<LindyAnnotation[]>(
    //     props.annotation.relatedAnnotations || []
    // );
    // useEffect(() => {
    //     if (props.annotation.isMyAnnotation && props.annotation.focused) {
    //         ky.post("https://assistant-two.vercel.app/api/query", {
    //             json: {
    //                 query: props.annotation.quote_text,
    //             },
    //             timeout: false,
    //         })
    //             .json()
    //             .then(setRelated);
    //     }
    // }, []);

    return (
        <>
            {props.annotation.platform !== "info" && (
                <Component
                    {...props}
                    deleteHide={() => props.deleteHideAnnotation(props.annotation, null)}
                    createReply={() => props.createReply(props.annotation, props.annotation)}
                    showingReplies={showReplies}
                    isReply={replyLevel !== 0}
                    // relatedCount={related?.length}
                    // showRelated={() => setShowRelated(true)}
                />
            )}

            {/* {props.annotation.platform === "info" && !linked && (
                <div
                    className="annotation-bar relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-800 shadow transition-transform hover:scale-[99%] md:text-base"
                    style={{
                        // borderLeft: `8px solid ${getAnnotationColor(props.annotation)}`,
                        backgroundColor: getAnnotationColor(props.annotation),
                    }}
                    onClick={() => setLinked(true)}
                    ref={ref}
                >
                    <svg className="-mt-0.5 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M512 288c0 35.35-21.49 64-48 64c-32.43 0-31.72-32-55.64-32C394.9 320 384 330.9 384 344.4V480c0 17.67-14.33 32-32 32h-71.64C266.9 512 256 501.1 256 487.6C256 463.1 288 464.4 288 432c0-26.51-28.65-48-64-48s-64 21.49-64 48c0 32.43 32 31.72 32 55.64C192 501.1 181.1 512 167.6 512H32c-17.67 0-32-14.33-32-32v-135.6C0 330.9 10.91 320 24.36 320C48.05 320 47.6 352 80 352C106.5 352 128 323.3 128 288S106.5 223.1 80 223.1c-32.43 0-31.72 32-55.64 32C10.91 255.1 0 245.1 0 231.6v-71.64c0-17.67 14.33-31.1 32-31.1h135.6C181.1 127.1 192 117.1 192 103.6c0-23.69-32-23.24-32-55.64c0-26.51 28.65-47.1 64-47.1s64 21.49 64 47.1c0 32.43-32 31.72-32 55.64c0 13.45 10.91 24.36 24.36 24.36H352c17.67 0 32 14.33 32 31.1v71.64c0 13.45 10.91 24.36 24.36 24.36c23.69 0 23.24-32 55.64-32C490.5 223.1 512 252.7 512 288z"
                        />
                    </svg>
                    <span>{props.annotation.relatedAnnotations.length} related notes</span>
                </div>
            )} */}

            {/* {showReplies && props.annotation.reply_count > 0 && (
                <div className="annotation-reply ml-5 mt-1">
                    {props.annotation.replies?.map((reply) => (
                        <AnnotationThread
                            key={reply.id}
                            {...props}
                            annotation={reply}
                            replyLevel={replyLevel + 1}
                            deleteHideAnnotation={
                                replyLevel === 0
                                    ? (nestedAnnotation: LindyAnnotation) =>
                                          props.deleteHideAnnotation(
                                              nestedAnnotation,
                                              props.annotation
                                          )
                                    : props.deleteHideAnnotation
                            }
                            createReply={
                                replyLevel === 0
                                    ? (nestedAnnotation: LindyAnnotation) =>
                                          props.createReply(nestedAnnotation, props.annotation)
                                    : props.createReply
                            }
                        />
                    ))}
                </div>
            )} */}

            {/* {related.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                    {related?.slice(0, 3).map((r) => (
                        <Annotation
                            key={r.id}
                            {...props}
                            annotation={r}
                            deleteHide={() => props.deleteHideAnnotation(props.annotation, null)}
                            createReply={() =>
                                props.createReply(props.annotation, props.annotation)
                            }
                            showingReplies={showReplies}
                            isReply={false}
                            isRelated
                        />
                    ))}
                </div>
            )} */}
        </>
    );
}
export default AnnotationThread;
