import React from "react";
import AnnotationThread from "./AnnotationThread";

const sidebarOoffsetTopPx = 50;

function AnnotationsList({
    groupedAnnotations,
    onClick = null,
    deleteHideAnnotation,
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
                    onAnnotationHoverUpdate={onAnnotationHoverUpdate}
                    hypothesisSyncEnabled={hypothesisSyncEnabled}
                    createReply={createReply}
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
    onAnnotationHoverUpdate,
    hypothesisSyncEnabled,
    createReply,
}) {
    return (
        <div
            className="absolute w-full flex flex-col gap-1"
            style={{
                top: group[0].displayOffset - sidebarOoffsetTopPx,
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
                        />
                    </div>
                );
            })}
        </div>
    );
}
