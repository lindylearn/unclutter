import React from "react";
import Annotation from "./Annotation";
import AnnotationDraft from "./AnnotationDraft";

export default function PageNotesList({
    url,
    annotations,
    createAnnotation,
    deleteHideAnnotation,
}) {
    return (
        <div className="flex flex-col gap-1">
            {annotations.map((a) => (
                <PageNote
                    url={url}
                    key={a.id}
                    annotation={a}
                    createAnnotation={createAnnotation}
                    deleteHideAnnotation={() => deleteHideAnnotation(a)}
                />
            ))}
        </div>
    );
}

export function PageNote({ url, annotation, createAnnotation, deleteHideAnnotation }) {
    const Component = annotation.isMyAnnotation ? AnnotationDraft : Annotation;

    return (
        <Component
            url={url}
            annotation={annotation}
            className="rounded border-l-0"
            createAnnotation={createAnnotation}
            deleteHideAnnotation={deleteHideAnnotation}
            placeholder="Page note"
        />
    );
}
