import React, { useEffect, useState } from "react";
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
    const [related, setRelated] = useState<LindyAnnotation[]>();
    useEffect(() => {
        if (props.annotation.isMyAnnotation && props.annotation.focused) {
            fetch("https://q5ie5hjr3g.execute-api.us-east-2.amazonaws.com/default/related", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: "",
                    url: props.annotation.url,
                    highlights: [props.annotation.quote_text],
                    score_threshold: 0.4,
                    save_highlights: false, // testing
                }),
            }).then((r) => r.json().then((r) => setRelated(r.related[0])));
        }
    }, []);

    const deleteHide = () => props.deleteHideAnnotation(props.annotation, null);

    return (
        <>
            {!props.annotation.isMyAnnotation && <Annotation {...props} deleteHide={deleteHide} />}
            {props.annotation.isMyAnnotation && (
                <AnnotationDraft {...props} deleteHide={deleteHide} />
            )}

            {related?.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                    {related?.slice(0, 2).map((r: any) => (
                        <Annotation
                            key={r.id}
                            {...props}
                            annotation={{
                                ...r,
                                platform: "related",
                                relatedId: props.annotation.id,
                            }}
                            deleteHide={() => props.deleteHideAnnotation(props.annotation, null)}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
export default AnnotationThread;
