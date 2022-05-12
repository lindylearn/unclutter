import React from "react";
import AnnotationThread from "./AnnotationThread";

function AnnotationsList({
    groupedAnnotations,
    onClick = null,
    deleteHideAnnotation,
    upvotedAnnotations = {},
    upvoteAnnotation = null,
    onAnnotationHoverUpdate,
    hypothesisSyncEnabled,
    createReply,
}) {
    return (
        <div className="relative flex-grow" onClick={onClick}>
            {groupedAnnotations.map((group, groupIndex) => (
                <AnnotationGroup
                    key={group[0].localId}
                    group={group}
                    nextGroup={
                        groupIndex < groupedAnnotations.length - 1 &&
                        groupedAnnotations[groupIndex + 1]
                    }
                    deleteHideAnnotation={deleteHideAnnotation}
                    offsetTop={50}
                    onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                    hypothesisSyncEnabled={hypothesisSyncEnabled}
                    createReply={createReply}
                    // upvotedAnnotations={upvotedAnnotations}
                    // upvoteAnnotation={upvoteAnnotation}
                />
            ))}
        </div>
    );
}
export default AnnotationsList;

function AnnotationGroup({
    group,
    nextGroup,
    deleteHideAnnotation,
    upvotedAnnotations = {},
    upvoteAnnotation = null,
    offsetTop = 0,
    onAnnotationHoverUpdate,
    hypothesisSyncEnabled,
    createReply,
}) {
    return (
        <div
            className="absolute w-full flex flex-col gap-1"
            style={{
                top: group[0].displayOffset - offsetTop,
            }}
        >
            {group.map((annotation, annotationIndex) => {
                return (
                    <div
                        key={annotation.localId}
                        className="annotation-group-item"
                    >
                        <AnnotationThread
                            annotation={annotation}
                            deleteHideAnnotation={deleteHideAnnotation}
                            heightLimitPx={
                                nextGroup &&
                                nextGroup[0].displayOffset -
                                    group[0].displayOffset -
                                    4
                            }
                            upvoted={upvotedAnnotations[annotation.id]}
                            // upvoteAnnotation={(isUpvote) =>
                            //     upvoteAnnotation(
                            //         url,
                            //         annotation.id,
                            //         isUpvote
                            //     )
                            // }
                            onHoverUpdate={(hoverActive: boolean) =>
                                // call hover on top level annotation
                                onAnnotationHoverUpdate(annotation, hoverActive)
                            }
                            hypothesisSyncEnabled={hypothesisSyncEnabled}
                            createReply={createReply}
                        />
                    </div>
                );
            })}
        </div>
    );
}
