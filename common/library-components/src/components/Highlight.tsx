import clsx from "clsx";
import React, { useContext, useEffect, useState } from "react";
// import { useDebounce } from "usehooks-ts";
// import TextareaAutosize from "react-textarea-autosize";
import {
    getAIAnnotationColor,
    getDomain,
    getRandomLightColor,
    getRelativeTime,
    openArticleResilient,
    sendMessage,
} from "../common";
import { Annotation, Article, readingProgressFullClamp, ReplicacheContext } from "../store";
import { getActivityColor } from "./Charts";
import { HighlightDropdown } from "./Dropdown/HighlightDowndown";
import { ModalContext, ResourceIcon } from "./Modal";

export function Highlight({
    annotation,
    article,
    isCurrentArticle,
    darkModeEnabled,
    reportEvent = () => {},
}: {
    annotation: Annotation;
    article: Article | undefined;
    isCurrentArticle: boolean;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    // const rep = useContext(ReplicacheContext);
    const { closeModal } = useContext(ModalContext);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    function openHighlight(e) {
        e.preventDefault();
        e.stopPropagation();

        if (isCurrentArticle) {
            closeModal?.();
            sendMessage({ event: "focusAnnotation", focusedAnnotation: annotation.id });
        } else if (article?.url) {
            // open new tab & scroll to highlight
            openArticleResilient(article.url, true, annotation.id);
        }

        reportEvent("openHighlight", { isCurrentArticle });
    }

    // const [localText, setLocalText] = useState(annotation.text);
    // useEffect(() => {
    //     setLocalText(annotation.text);
    // }, [annotation.text]);
    // const localTextDebounced = useDebounce(localText, 500);
    // useEffect(() => {
    //     if (localTextDebounced !== annotation.text) {
    //         rep?.mutate.updateAnnotation({
    //             id: annotation.id,
    //             text: localTextDebounced,
    //         });
    //     }
    // }, [localTextDebounced]);

    // if (annotation.tags?.length === 0) {
    //     annotation.tags = ["tag1", "tag2"];
    // }

    return (
        <div
            className="highlight animate-fadein relative flex cursor-pointer select-none flex-col gap-4 overflow-hidden rounded-md bg-white p-4 text-sm text-stone-900 transition-transform hover:scale-[99%] dark:text-white"
            style={{
                background: annotation.ai_created
                    ? getAIAnnotationColor(annotation.ai_score, darkModeEnabled)
                    : getRandomLightColor(
                          annotation.tags?.[0] || annotation.article_id || annotation.id,
                          darkModeEnabled
                      ),
                // maxHeight: "calc(177px+2*8px)",
            }}
            // href={article?.url}
            onClick={openHighlight}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen(true);
            }}
        >
            {/* <HighlightDropdown
                annotation={annotation}
                open={dropdownOpen}
                setOpen={setDropdownOpen}
                reportEvent={reportEvent}
            /> */}

            {/* <h2 className="tags flex gap-2 overflow-hidden px-2 leading-normal">
                {annotation.tags?.slice(0, 2)?.map((tag) => (
                    <div key={tag} className="tag font-title whitespace-nowrap text-base">
                        #{tag}
                    </div>
                ))}
            </h2> */}

            <LimitedText
                className={clsx("flex-grow leading-normal")}
                text={annotation.text || annotation.quote_text}
                rows={8}
            />

            {/* <div>
                {annotation.score?.toFixed(2)}
                {annotation.score2?.toFixed(2)}
            </div> */}

            {/* <div className="flex items-center gap-2">
                <TextareaAutosize
                    className="w-full select-none resize-none rounded-md bg-stone-100 p-2 align-top text-sm outline-none placeholder:select-none placeholder:text-stone-900 placeholder:opacity-50 dark:placeholder:text-white"
                    style={{
                        background: "rgba(255,255,255,30%)",
                    }}
                    placeholder="Add a note..."
                    value={localText}
                    onChange={(e) => setLocalText(e.target.value)}
                    minRows={localText ? 5 : 1}
                    maxRows={10}
                    onClick={(e) => e.stopPropagation()}
                />
            </div> */}

            {article ? (
                <div className="info-bar flex items-center justify-between gap-2 whitespace-nowrap font-medium">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img
                            className="w-4 shrink-0 rounded-sm"
                            src={`https://www.google.com/s2/favicons?sz=128&domain=https://${getDomain(
                                article.url
                            )}`}
                        />

                        <div className="overflow-hidden text-ellipsis">{article?.title}</div>
                    </div>
                </div>
            ) : (
                <div className="text-base"> </div>
            )}
        </div>
    );
}

function LimitedText({
    className,
    text,
    rows = 8,
}: {
    className?: string;
    text?: string;
    rows?: number;
}) {
    return (
        <div
            className={clsx("overflow-hidden text-ellipsis leading-normal", className)}
            style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: rows,
            }}
        >
            &quot;{text}&quot;
        </div>
    );
}
