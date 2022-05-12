import React from "react";
import { LindyAnnotation } from "../../common/annotations/create";
import AnnotationThread from "./AnnotationThread";

const groupMargin = 150; // should be larger than rendered annotation height

function AnnotationsList({
    url,
    annotations,
    onClick = null,
    deleteHideAnnotation,
    upvotedAnnotations = {},
    upvoteAnnotation = null,
    offsetTop = 0,
    onAnnotationHoverUpdate,
    hypothesisSyncEnabled,
    createReply,
}) {
    if (!annotations) {
        return <div></div>;
    }

    const orderedAnnotations: LindyAnnotation[] = annotations
        .filter((a) => a.displayOffset)
        .sort((a, b) => a.displayOffset - b.displayOffset);

    // group annotations that are close together

    let groupedAnnotations: LindyAnnotation[][] = [];
    let lastOffset = -Infinity;
    for (const annotation of orderedAnnotations) {
        if (annotation.displayOffset < lastOffset + groupMargin) {
            // conflict, append to last group
            groupedAnnotations[groupedAnnotations.length - 1] = [
                ...groupedAnnotations[groupedAnnotations.length - 1],
                annotation,
            ];
        } else {
            // no conflict, start new group
            groupedAnnotations.push([annotation]);
        }
        lastOffset = annotation.displayOffsetEnd;
    }

    // take best comment from each group
    groupedAnnotations = groupedAnnotations.map((groupList) => {
        // show all personal annotations, but filter social comments
        const myAnnotations = groupList.filter((a) => a.isMyAnnotation);
        const bestSocialComments = groupList
            .filter((a) => !a.isMyAnnotation)
            .sort((a, b) => {
                // prefer more replies
                if (b.reply_count !== a.reply_count) {
                    return b.reply_count - a.reply_count;
                }

                // prefer longer comments
                return b.text.length - a.text.length;
            })
            .slice(0, 1);

        // Order by appearance
        return bestSocialComments
            .concat(myAnnotations)
            .sort((a, b) => a.displayOffset - b.displayOffset);
    });

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
