import React from "react";
import { LindyAnnotation } from "../../common/annotations/create";
import AnnotationThread from "./AnnotationThread";

const sidebarOffsetTopPx = 50;

interface AnnotationsListProps {
    groupedAnnotations: LindyAnnotation[][];
    hypothesisSyncEnabled: boolean;
    deleteHideAnnotation: (
        annotation: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;
    onAnnotationHoverUpdate: (
        annotation: LindyAnnotation,
        hoverActive: boolean
    ) => void;
    createReply: (
        parent: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
}

function AnnotationsList({
    groupedAnnotations,
    hypothesisSyncEnabled,
    deleteHideAnnotation,
    onAnnotationHoverUpdate,
    createReply,
    updateAnnotation,
}: AnnotationsListProps) {
    return (
        <div className="relative flex-grow">
            {groupedAnnotations.map((group, groupIndex) => (
                <AnnotationGroup
                    key={group[0].localId}
                    group={group}
                    nextGroup={
                        groupIndex < groupedAnnotations.length - 1 &&
                        groupedAnnotations[groupIndex + 1]
                    }
                    deleteHideAnnotation={deleteHideAnnotation}
                    onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                    hypothesisSyncEnabled={hypothesisSyncEnabled}
                    createReply={createReply}
                    updateAnnotation={updateAnnotation}
                />
            ))}
        </div>
    );
}
export default AnnotationsList;

interface AnnotationGroupProps {
    group: LindyAnnotation[];
    nextGroup?: LindyAnnotation[];
    hypothesisSyncEnabled: boolean;
    deleteHideAnnotation: (
        annotation: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;
    onAnnotationHoverUpdate: (
        annotation: LindyAnnotation,
        hoverActive: boolean
    ) => void;
    createReply: (
        parent: LindyAnnotation,
        threadStart: LindyAnnotation
    ) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
}

function AnnotationGroup({
    group,
    nextGroup,
    hypothesisSyncEnabled,
    deleteHideAnnotation,
    onAnnotationHoverUpdate,
    createReply,
    updateAnnotation,
}: AnnotationGroupProps) {
    return (
        <div
            className="absolute w-full flex flex-col gap-1"
            style={{
                top: group[0].displayOffset - sidebarOffsetTopPx,
            }}
        >
            {group.map((annotation) => {
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
                            onHoverUpdate={(hoverActive: boolean) =>
                                // call hover on top level annotation
                                onAnnotationHoverUpdate(annotation, hoverActive)
                            }
                            hypothesisSyncEnabled={hypothesisSyncEnabled}
                            createReply={createReply}
                            updateAnnotation={updateAnnotation}
                        />
                    </div>
                );
            })}
        </div>
    );
}
