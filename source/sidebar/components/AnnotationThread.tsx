import React from "react";
import { LindyAnnotation } from "../../common/annotations/create";
import Annotation from "./Annotation";
import AnnotationDraft from "./AnnotationDraft";

const maxReplyNesting = 1;

interface AnnotationThreadProps {
    url: string;
    annotation: LindyAnnotation;
    heightLimitPx: number;

    hypothesisSyncEnabled: boolean;
    deleteHideAnnotation: (
        annotation: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    createReply: (
        parent: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;

    replyLevel?: number;
}

function AnnotationThread(props: AnnotationThreadProps) {
    const replyLevel = props.replyLevel || 0;

    const Component = props.annotation.isMyAnnotation
        ? AnnotationDraft
        : Annotation;

    const spaceForReplies = props.heightLimitPx - 140;
    const showReplies =
        replyLevel < maxReplyNesting &&
        spaceForReplies >= props.annotation.reply_count * 100;

    return (
        <>
            <Component
                {...props}
                deleteHide={() =>
                    props.deleteHideAnnotation(props.annotation, null)
                }
                createReply={() =>
                    props.createReply(props.annotation, props.annotation)
                }
                showingReplies={showReplies}
                isReply={replyLevel !== 0}
            />
            {showReplies && props.annotation.reply_count > 0 && (
                <div className="annotation-reply ml-5">
                    {props.annotation.replies?.map((reply) => (
                        <AnnotationThread
                            key={reply.localId}
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
                                          props.createReply(
                                              nestedAnnotation,
                                              props.annotation
                                          )
                                    : props.createReply
                            }
                        />
                    ))}
                </div>
            )}
        </>
    );
}
export default AnnotationThread;
