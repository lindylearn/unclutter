import React, { useLayoutEffect, useRef, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { LindyAnnotation } from "../../common/annotations/create";
import AnnotationThread from "./AnnotationThread";

const sidebarOffsetTopPx = 50;

interface AnnotationsListProps {
    groupedAnnotations: LindyAnnotation[][];
    hypothesisSyncEnabled: boolean;
    showAllSocialAnnotations: boolean;
    deleteHideAnnotation: (
        annotation: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;
    onAnnotationHoverUpdate: (
        annotation: LindyAnnotation,
        hoverActive: boolean
    ) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
    createReply: (
        parent: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
}

const annotationMarginPx = 4;

function AnnotationsList({
    groupedAnnotations,
    hypothesisSyncEnabled,
    showAllSocialAnnotations,
    deleteHideAnnotation,
    onAnnotationHoverUpdate,
    unfocusAnnotation,
    createReply,
    updateAnnotation,
}: AnnotationsListProps) {
    const itemsRef = useRef({}); // annotation localId -> ref of rendered annotation node

    const [x, setX] = useState(0);
    useLayoutEffect(() => {
        // every time the displayed annotations change, trigger a second pass render (before first is completed)
        // this allows grouped annotations to access the rendered height of their siblings
        setX(x + 1);
    }, [groupedAnnotations]);

    return (
        <TransitionGroup className="annotation-list relative">
            {/* render annotations in flat list to animate fade-out and regroups */}
            {groupedAnnotations.flatMap((group, groupIndex) => {
                // const nextGroup =
                //     groupIndex < groupedAnnotations.length - 1 &&
                //     groupedAnnotations[groupIndex + 1];
                // const groupHeightLimitPx =
                //     (nextGroup?.[0]?.displayOffset ||
                //         document.documentElement.scrollHeight +
                //             sidebarOffsetTopPx) -
                //     group[0].displayOffset -
                //     annotationMarginPx;

                const groupTopOffset =
                    group[0].displayOffset - sidebarOffsetTopPx;

                return group.map((annotation, i) => {
                    // items are in flat list, so must track previous group items for correct absolute position
                    const prevSiblingsRefs = group
                        .slice(0, i)
                        .map((a) => itemsRef.current?.[a.localId]);

                    // get absolute offset after the group start
                    let innerGroupOffset: number;
                    if (i === 0) {
                        // first item in group (most common case)
                        innerGroupOffset = 0;
                    } else if (prevSiblingsRefs.some((a) => !a)) {
                        // first pass render: not all siblings have rendered yet
                        // for now, assume default height (for draft empty comments)
                        innerGroupOffset = 60 * i;
                    } else {
                        // second pass render: know heights of previous siblings
                        // sum them up to get correct offset inside group
                        innerGroupOffset = prevSiblingsRefs
                            .map((ref) => ref.clientHeight)
                            .reduce(
                                (sum, height) =>
                                    sum + height + annotationMarginPx,
                                0
                            );
                    }

                    return (
                        <CSSTransition
                            key={annotation.localId}
                            timeout={500} // must be larger than animation duration
                            classNames="annotation-list-item"
                        >
                            <div
                                key={annotation.localId}
                                className="annotation-list-item absolute w-full"
                                style={{
                                    top: groupTopOffset + innerGroupOffset,
                                }}
                                ref={(el) =>
                                    (itemsRef.current[annotation.localId] = el)
                                }
                            >
                                <AnnotationThread
                                    annotation={annotation}
                                    deleteHideAnnotation={deleteHideAnnotation}
                                    // heightLimitPx={
                                    //     groupHeightLimitPx / group.length
                                    // } // give each item equal share -- always avoids overflows
                                    onHoverUpdate={(hoverActive: boolean) =>
                                        // call hover on top level annotation
                                        onAnnotationHoverUpdate(
                                            annotation,
                                            hoverActive
                                        )
                                    }
                                    unfocusAnnotation={unfocusAnnotation}
                                    hypothesisSyncEnabled={
                                        hypothesisSyncEnabled
                                    }
                                    createReply={createReply}
                                    updateAnnotation={updateAnnotation}
                                />
                            </div>
                        </CSSTransition>
                    );
                });
            })}
        </TransitionGroup>
    );
}
export default AnnotationsList;
