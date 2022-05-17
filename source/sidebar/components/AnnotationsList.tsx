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
            {group
                .filter(
                    (a) =>
                        a.isMyAnnotation ||
                        showAllSocialAnnotations ||
                        a.focused
                )
                .map((annotation) => {
                    return (
                        <div
                            key={annotation.localId}
                            className="annotation-group-item"
                        >
                            <AnnotationThread
                                annotation={annotation}
                                deleteHideAnnotation={deleteHideAnnotation}
                                heightLimitPx={
                                    (nextGroup?.[0]?.displayOffsetEnd ||
                                        document.documentElement.scrollHeight +
                                            sidebarOffsetTopPx) -
                                    group[0].displayOffsetEnd -
                                    4
                                }
                                onHoverUpdate={(hoverActive: boolean) =>
                                    // call hover on top level annotation
                                    onAnnotationHoverUpdate(
                                        annotation,
                                        hoverActive
                                    )
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
