import React from "react";
import AnnotationThread from "./AnnotationThread";

function AnnotationsList({
    url,
    annotations,
    onClick = null,
    deleteHideAnnotation,
    upvotedAnnotations = {},
    upvoteAnnotation = null,
    offsetTop = 0,
    onAnnotationHoverUpdate,
}) {
    if (!annotations) {
        return <div></div>;
    }

    const orderedAnnotations = annotations
        .filter((a) => a.displayOffset)
        .sort((a, b) => a.displayOffset - b.displayOffset);

    const groupedAnnotations = [];
    let lastOffset = -Infinity;
    for (const annotation of orderedAnnotations) {
        if (annotation.displayOffset < lastOffset + 100) {
            // conflict, append to last group
            groupedAnnotations[groupedAnnotations.length - 1] = [
                ...groupedAnnotations[groupedAnnotations.length - 1],
                annotation,
            ];
        } else {
            // no conflict, start new group
            groupedAnnotations.push([annotation]);
        }
        lastOffset = annotation.displayOffset;
    }

    return (
        <div className="relative flex-grow" onClick={onClick}>
            {groupedAnnotations.map((group, groupIndex) => (
                <div
                    key={group[0].localId}
                    className="absolute w-full"
                    style={{
                        top: group[0].displayOffset - offsetTop,
                        position: "relative",
                    }}
                >
                    {group.slice(0, 5).map((annotation, i) => {
                        return (
                            <div
                                key={annotation.localId}
                                className={
                                    "annotation-group-item w-full rounded-r " +
                                    (group.length > 1
                                        ? "hover:z-10 hover:drop-shadow"
                                        : "")
                                }
                                style={{
                                    position: "absolute",
                                    top: `${i * 40}px`,
                                }}
                            >
                                <AnnotationThread
                                    annotation={annotation}
                                    deleteHideAnnotation={deleteHideAnnotation}
                                    charLimit={
                                        i == group.length - 1 ? 400 : 200
                                    }
                                    upvoted={upvotedAnnotations[annotation.id]}
                                    upvoteAnnotation={(isUpvote) =>
                                        upvoteAnnotation(
                                            url,
                                            annotation.id,
                                            isUpvote
                                        )
                                    }
                                    onHoverUpdate={(hoverActive: boolean) =>
                                        // call hover on top level annotation
                                        onAnnotationHoverUpdate(
                                            annotation,
                                            hoverActive
                                        )
                                    }
                                    animationIndex={groupIndex}
                                />
                            </div>
                        );
                    })}
                    {/* <div>{group.length - 1 - 5} more annotations</div> */}
                </div>
            ))}
        </div>
    );
}
export default AnnotationsList;
