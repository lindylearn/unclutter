import React from "react";
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
    return (
        <TransitionGroup className="annotation-list relative flex-grow">
            {/* render annotations in flat list to animate fade-out and regroups */}
            {groupedAnnotations.flatMap((group, groupIndex) => {
                const nextGroup =
                    groupIndex < groupedAnnotations.length - 1 &&
                    groupedAnnotations[groupIndex + 1];

                const groupTopOffset =
                    group[0].displayOffset - sidebarOffsetTopPx;
                const groupHeightLimitPx =
                    (nextGroup?.[0]?.displayOffset ||
                        document.documentElement.scrollHeight +
                            sidebarOffsetTopPx) -
                    group[0].displayOffset -
                    4; // margin;

                return group.map((annotation, i) => {
                    return (
                        <CSSTransition
                            key={annotation.localId}
                            timeout={500}
                            classNames="annotation-list-item"
                        >
                            <div
                                key={annotation.localId}
                                className="absolute"
                                style={{
                                    top: groupTopOffset + 60 * i,
                                }}
                            >
                                <AnnotationThread
                                    annotation={annotation}
                                    deleteHideAnnotation={deleteHideAnnotation}
                                    heightLimitPx={
                                        groupHeightLimitPx / group.length
                                    } // give each item equal share -- always avoids overflows
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
