import React from "react";
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
                    unfocusAnnotation={unfocusAnnotation}
                    hypothesisSyncEnabled={hypothesisSyncEnabled}
                    showAllSocialAnnotations={showAllSocialAnnotations}
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

function AnnotationGroup({
    group,
    nextGroup,
    hypothesisSyncEnabled,
    showAllSocialAnnotations,
    deleteHideAnnotation,
    onAnnotationHoverUpdate,
    unfocusAnnotation,
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
                const heightLimitPx =
                    (nextGroup?.[0]?.displayOffset ||
                        document.documentElement.scrollHeight +
                            sidebarOffsetTopPx) -
                    group[0].displayOffset -
                    4; // margin;

                return (
                    <div
                        key={annotation.localId}
                        className="annotation-group-item"
                    >
                        <AnnotationThread
                            annotation={annotation}
                            deleteHideAnnotation={deleteHideAnnotation}
                            heightLimitPx={heightLimitPx / group.length} // give each item equal share -- always avoids overflows
                            onHoverUpdate={(hoverActive: boolean) =>
                                // call hover on top level annotation
                                onAnnotationHoverUpdate(annotation, hoverActive)
                            }
                            unfocusAnnotation={unfocusAnnotation}
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
