import { ReplicacheProxy } from "@unclutter/library-components/dist/common/replicache";
import React, { useEffect, useState } from "react";
import type { LindyAnnotation } from "../../common/annotations/create";
import {
    fetchRelatedAnnotations,
    RelatedHighlight,
} from "@unclutter/library-components/dist/common/api";
// import { getAnnotationColor } from "../../common/annotations/styling";
import Annotation from "./Annotation";
import AnnotationDraft from "./AnnotationDraft";
import clsx from "clsx";
import { getAIAnnotationColor } from "@unclutter/library-components/dist/common/styling";
import { getAnnotationColor } from "../../common/annotations/styling";
// import SummaryAnnotation from "./Summary";

interface AnnotationThreadProps {
    annotation: LindyAnnotation;
    heightLimitPx?: number;

    deleteHideAnnotation: (annotation: LindyAnnotation, threadStart: LindyAnnotation) => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
    updateAnnotation: (annotation: LindyAnnotation) => void;
}

function AnnotationThread(props: AnnotationThreadProps) {
    const annotation = props.annotation;

    const [isFetchingRelated, setIsFetchingRelated] = useState(false);
    const [related, setRelated] = useState<RelatedHighlight[]>(annotation.related);
    useEffect(() => {
        if (annotation.isMyAnnotation && !annotation.ai_created) {
            setIsFetchingRelated(true);

            const userId = "test-user7";
            fetchRelatedAnnotations(userId, annotation.article_id, [annotation.quote_text])
                .then(async (response) => {
                    const related = response[0].slice(0, 2);

                    const rep = new ReplicacheProxy();
                    await Promise.all(
                        related.map(async (r) => {
                            r.article = await rep.query.getArticle(r.article_id);
                        })
                    );

                    setIsFetchingRelated(false);
                    setRelated(related);
                })
                .catch((err) => {
                    console.error(err);
                    setIsFetchingRelated(false);
                });
        }
    }, []);

    const deleteHide = () => props.deleteHideAnnotation(annotation, null);

    const draftVisible = annotation.isMyAnnotation && (annotation.text || annotation.focused);

    let color: string;
    let colorDark: string;
    if (annotation.ai_created) {
        color = getAIAnnotationColor(annotation.ai_score);
        colorDark = getAIAnnotationColor(annotation.ai_score, true);
    } else if (annotation.isMyAnnotation) {
        color = getAnnotationColor(annotation);
    } else if (annotation.platform === "hn") {
        color = "rgba(255, 102, 0, 0.5)";
    } else if (annotation.platform === "h") {
        color = "rgba(189, 28, 43, 0.5)";
    }

    return (
        <>
            {/* {annotation.platform === "summary" && (
                <SummaryAnnotation summaryInfo={annotation.summaryInfo!} />
            )} */}
            {draftVisible && (
                <AnnotationDraft
                    {...props}
                    isFetchingRelated={isFetchingRelated}
                    relatedCount={related?.length}
                    color={color}
                    colorDark={colorDark}
                    deleteHide={deleteHide}
                />
            )}
            {!annotation.isMyAnnotation && annotation.platform !== "summary" && (
                <Annotation
                    {...props}
                    color={color}
                    colorDark={colorDark}
                    deleteHide={deleteHide}
                />
            )}

            {/* {annotation.isMyAnnotation && (
                <div
                    className="annotation-bar relative flex cursor-pointer items-center gap-2 rounded-sm rounded-tr-md px-3 py-2 text-sm shadow transition-transform hover:scale-[99%] md:text-base"
                    style={{
                        // borderLeft: `8px solid ${getAnnotationColor(annotation)}`,
                        backgroundColor: getAnnotationColor(annotation),
                    }}
                >
                    <svg className="-mt-0.5 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M512 288c0 35.35-21.49 64-48 64c-32.43 0-31.72-32-55.64-32C394.9 320 384 330.9 384 344.4V480c0 17.67-14.33 32-32 32h-71.64C266.9 512 256 501.1 256 487.6C256 463.1 288 464.4 288 432c0-26.51-28.65-48-64-48s-64 21.49-64 48c0 32.43 32 31.72 32 55.64C192 501.1 181.1 512 167.6 512H32c-17.67 0-32-14.33-32-32v-135.6C0 330.9 10.91 320 24.36 320C48.05 320 47.6 352 80 352C106.5 352 128 323.3 128 288S106.5 223.1 80 223.1c-32.43 0-31.72 32-55.64 32C10.91 255.1 0 245.1 0 231.6v-71.64c0-17.67 14.33-31.1 32-31.1h135.6C181.1 127.1 192 117.1 192 103.6c0-23.69-32-23.24-32-55.64c0-26.51 28.65-47.1 64-47.1s64 21.49 64 47.1c0 32.43-32 31.72-32 55.64c0 13.45 10.91 24.36 24.36 24.36H352c17.67 0 32 14.33 32 31.1v71.64c0 13.45 10.91 24.36 24.36 24.36c23.69 0 23.24-32 55.64-32C490.5 223.1 512 252.7 512 288z"
                        />
                    </svg>
                    {related && <span>{related?.length} related</span>}

                    {isFetchingRelated && (
                        <div className="loader absolute top-2 right-2 flex h-4 w-4 gap-2"></div>
                    )}
                </div>
            )} */}

            {related?.length > 0 && (
                <div className={clsx("flex flex-col gap-[6px]", draftVisible && "mt-[6px]")}>
                    {related?.map((r, i) => (
                        <Annotation
                            key={r.id}
                            className="related-annotation"
                            style={{ animationDelay: `${i * 50}ms` }}
                            {...props}
                            annotation={{
                                ...annotation,
                                ...r,
                                platform: "related",
                            }}
                            color={color}
                            colorDark={colorDark}
                            deleteHide={deleteHide}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
export default AnnotationThread;
