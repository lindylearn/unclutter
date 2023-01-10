import React from "react";
import type { LindyAnnotation } from "../../common/annotations/create";
import Annotation from "./Annotation";
import AnnotationDraft from "./AnnotationDraft";

interface AnnotationThreadProps {
    annotation: LindyAnnotation;
    heightLimitPx?: number;

    deleteHideAnnotation: (annotation: LindyAnnotation, threadStart: LindyAnnotation) => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
}

function AnnotationThread(props: AnnotationThreadProps) {
    const Component = props.annotation.isMyAnnotation ? AnnotationDraft : Annotation;
    return (
        <>
            <Component
                {...props}
                deleteHide={() => props.deleteHideAnnotation(props.annotation, null)}
            />

            {/* {props.annotation.relatedAnnotations?.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                    {props.annotation.relatedAnnotations?.slice(0, 3).map((r: any) => (
                        <Annotation
                            key={r.id}
                            {...props}
                            annotation={{
                                ...props.annotation,
                                ...r,
                                text: r.excerpt + r.text,
                            }}
                            deleteHide={() => props.deleteHideAnnotation(props.annotation, null)}
                        />
                    ))}
                </div>
            )} */}
        </>
    );
}
export default AnnotationThread;
