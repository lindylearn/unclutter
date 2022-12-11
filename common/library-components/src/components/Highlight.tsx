import clsx from "clsx";
import React, { useContext, useEffect, useState } from "react";
import { useDebounce } from "usehooks-ts";
import TextareaAutosize from "react-textarea-autosize";
import { getRandomLightColor, getRelativeTime, openArticleResilient, sendMessage } from "../common";
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
    const rep = useContext(ReplicacheContext);
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

    const [localText, setLocalText] = useState(annotation.text);
    useEffect(() => {
        setLocalText(annotation.text);
    }, [annotation.text]);
    const localTextDebounced = useDebounce(localText, 500);
    useEffect(() => {
        rep?.mutate.updateAnnotation({
            id: annotation.id,
            text: localTextDebounced,
        });
    }, [localTextDebounced]);

    if (annotation.tags?.length === 0) {
        annotation.tags = ["tag1", "tag2"];
    }

    return (
        <a
            className="highlight animate-fadein relative flex cursor-pointer select-none flex-col gap-2 overflow-hidden rounded-md bg-white p-2 text-sm text-stone-900 shadow transition-transform hover:scale-[99.5%] dark:text-white"
            style={{
                background: annotation.is_favorite
                    ? getActivityColor(3, darkModeEnabled)
                    : getRandomLightColor(
                          annotation.tags?.[0] || annotation.article_id,
                          darkModeEnabled
                      ),
                maxHeight: "calc(177px+2*8px)",
            }}
            href={article?.url}
            onClick={openHighlight}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen(true);
            }}
        >
            <HighlightDropdown
                annotation={annotation}
                open={dropdownOpen}
                setOpen={setDropdownOpen}
                reportEvent={reportEvent}
            />

            <h2 className="tags flex gap-2 overflow-hidden px-2 leading-normal">
                {annotation.tags?.slice(0, 2)?.map((tag) => (
                    <div key={tag} className="tag font-title whitespace-nowrap text-base">
                        #{tag}
                    </div>
                ))}
            </h2>

            <LimitedText
                className={clsx("px-2 leading-normal", localText && "opacity-50")}
                text={annotation.quote_text}
                rows={localText ? 2 : 6}
            />

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
            />

            {!isCurrentArticle &&
                (article ? (
                    <div className="info-bar flex items-center justify-between gap-2 whitespace-nowrap font-medium">
                        <div className="text-medium flex items-center gap-1.5 overflow-hidden">
                            {annotation.is_favorite ? (
                                <svg
                                    viewBox="0 0 576 512"
                                    className="animate-fadein -mt-0.5 w-5 flex-shrink-0 transition-opacity"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"
                                    />
                                </svg>
                            ) : (
                                <ResourceIcon
                                    className="flex-shrink-0"
                                    type={
                                        article.reading_progress >= readingProgressFullClamp
                                            ? "articles_completed"
                                            : "articles"
                                    }
                                />
                            )}

                            <div className="overflow-hidden text-ellipsis">{article?.title}</div>
                        </div>
                    </div>
                ) : (
                    <div className="text-base"> </div>
                ))}
        </a>
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
