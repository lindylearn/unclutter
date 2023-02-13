import React, { useContext, useEffect, useState } from "react";
import type { LindyAnnotation } from "../../common/annotations/create";
import Annotation from "./Annotation";
import AnnotationDraft from "./AnnotationDraft";
import { getAnnotationColorNew } from "../../common/annotations/styling";
import { SidebarContext } from "../context";
import SummaryAnnotation from "./Summary";
import SearchBox from "./Searchbox";
import AnnotationDraftNew from "./AnnotationDraftNew";

interface AnnotationThreadProps {
    annotation: LindyAnnotation;
    heightLimitPx?: number;

    unfocusAnnotation: () => void;
    fetchRelatedLater: (annotation: LindyAnnotation) => Promise<void>;
    fetchTagsLater: (annotation: LindyAnnotation) => Promise<void>;
}

export default function AnnotationThread(props: AnnotationThreadProps) {
    const { userInfo } = useContext(SidebarContext);
    const annotation = props.annotation;

    // trigger related annotations fetch if not already done
    const [isFetchingRelated, setIsFetchingRelated] = useState(false);
    useEffect(() => {
        if (
            !userInfo?.aiEnabled ||
            !annotation.isMyAnnotation ||
            annotation.related !== undefined
        ) {
            return;
        }

        setIsFetchingRelated(true);
        props.fetchRelatedLater(annotation).then(() => setIsFetchingRelated(false));
    }, [userInfo]);

    const [isFetchingTags, setIsFetchingTags] = useState(false);
    useEffect(() => {
        if (!userInfo?.aiEnabled || !annotation.isMyAnnotation || annotation.tags?.length) {
            return;
        }

        setIsFetchingTags(true);
        props.fetchTagsLater(annotation).then(() => setIsFetchingTags(false));
    }, [userInfo]);

    const [color, colorDark] = getAnnotationColorNew(annotation);

    return (
        <>
            {annotation.platform === "summary" && (
                <>
                    <SummaryAnnotation summaryInfo={annotation.summaryInfo!} />
                    <SearchBox />
                </>
            )}

            {annotation.isMyAnnotation && !userInfo?.aiEnabled && (
                <AnnotationDraft
                    {...props}
                    isFetchingRelated={isFetchingRelated}
                    color={color}
                    colorDark={colorDark}
                />
            )}
            {annotation.isMyAnnotation && userInfo?.aiEnabled && (
                <AnnotationDraftNew
                    {...props}
                    isFetchingRelated={isFetchingRelated}
                    color={color}
                    colorDark={colorDark}
                />
            )}

            {!annotation.isMyAnnotation && annotation.platform !== "summary" && (
                <Annotation {...props} color={color} colorDark={colorDark} />
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
        </>
    );
}
