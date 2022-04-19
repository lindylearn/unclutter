import React from "react";
import AnnotationDraft from "./AnnotationDraft";
import AnnotationThread from "./AnnotationThread";

function AnnotationsList({
    url,
    annotations,
    showSocialAnnotations = true,
    onClick = null,
    deleteAnnotation,
    upvotedAnnotations = {},
    upvoteAnnotation = null,
    offsetTop = 0,
}) {
    if (!annotations) {
        return <div></div>;
    }

    const orderedAnnotations = annotations
        .filter((a) => showSocialAnnotations || a.isMyAnnotation)
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
            {groupedAnnotations.map((groupedAnnotations) => (
                <div
                    key={groupedAnnotations[0].displayOffset}
                    className="absolute w-full"
                    style={{
                        top: groupedAnnotations[0].displayOffset - offsetTop,
                        position: "relative",
                    }}
                >
                    {groupedAnnotations.slice(0, 5).map((annotation, i) => {
                        const Component = annotation.is_draft
                            ? AnnotationDraft
                            : AnnotationThread;

                        return (
                            <div
                                key={annotation.id}
                                className={
                                    "annotation-group-item w-full rounded-r " +
                                    (groupedAnnotations.length > 1
                                        ? "hover:z-10 hover:drop-shadow"
                                        : "")
                                }
                                style={{
                                    position: "absolute",
                                    top: `${i * 40}px`,
                                }}
                            >
                                <Component
                                    key={annotation.link}
                                    annotation={annotation}
                                    deleteAnnotation={() =>
                                        deleteAnnotation(annotation)
                                    }
                                    charLimit={
                                        i == groupedAnnotations.length - 1
                                            ? 400
                                            : 200
                                    }
                                    upvoted={upvotedAnnotations[annotation.id]}
                                    upvoteAnnotation={(isUpvote) =>
                                        upvoteAnnotation(
                                            url,
                                            annotation.id,
                                            isUpvote
                                        )
                                    }
                                />
                            </div>
                        );
                    })}
                    {/* <div>{groupedAnnotations.length - 1} more annotations</div> */}
                </div>
            ))}
        </div>
    );
}
export default AnnotationsList;
