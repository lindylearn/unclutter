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
    const [isFetchingRelated, setIsFetchingRelated] = useState(false);
    const [related, setRelated] = useState<LindyAnnotation[]>();
    useEffect(() => {
        if (props.annotation.isMyAnnotation) {
            setIsFetchingRelated(true);
            fetch("https://api2.lindylearn.io/related/get_related", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: "",
                    url: props.annotation.url,
                    highlights: [props.annotation.quote_text],
                    score_threshold: 0.5,
                    save_highlights: false, // testing
                }),
            }).then(async (response) => {
                const data = await response.json();

                setIsFetchingRelated(false);
                setRelated(data.related[0]);
            });
        }
    }, []);

    const deleteHide = () => props.deleteHideAnnotation(props.annotation, null);

    return (
        <>
            {!props.annotation.isMyAnnotation && <Annotation {...props} deleteHide={deleteHide} />}
            {props.annotation.isMyAnnotation && (
                <AnnotationDraft
                    {...props}
                    isFetchingRelated={isFetchingRelated}
                    deleteHide={deleteHide}
                />
            )}

            {related?.length > 0 && (
                <div className="mt-[6px] flex flex-col gap-[6px]">
                    {related?.slice(0, 2).map((r: any, i) => (
                        <Annotation
                            key={r.id}
                            className="related-annotation"
                            style={{ animationDelay: `${i * 50}ms` }}
                            {...props}
                            annotation={{
                                ...r,
                                platform: "related",
                                relatedId: props.annotation.id,
                            }}
                            deleteHide={deleteHide}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
export default AnnotationThread;
