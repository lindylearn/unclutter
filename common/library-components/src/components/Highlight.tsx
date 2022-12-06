import clsx from "clsx";
import React, { useContext, useState } from "react";
import { getRandomLightColor, getRelativeTime, openArticleResilient, sendMessage } from "../common";
import { Annotation, Article, readingProgressFullClamp } from "../store";
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

    return (
        <a
            className="highlight animate-fadein relative flex cursor-pointer select-none flex-col justify-between gap-3 overflow-hidden rounded-md bg-stone-100 p-3 px-4 text-sm text-stone-900 transition-all hover:scale-[99.5%] dark:text-white"
            style={{
                background: annotation.is_favorite
                    ? getActivityColor(3, darkModeEnabled)
                    : getRandomLightColor(annotation.article_id, darkModeEnabled),
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

            {annotation.quote_text && <LimitedText text={`"${annotation.quote_text}"`} />}
            {annotation.text && <LimitedText className="font-medium" text={annotation.text} />}

            {article ? (
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

                    {/* <div className="flex-grow" />
                    <div className="time flex items-center gap-1.5 ">
                        <svg className="h-4" viewBox="0 0 448 512">
                            <path
                                fill="currentColor"
                                d="M152 64H296V24C296 10.75 306.7 0 320 0C333.3 0 344 10.75 344 24V64H384C419.3 64 448 92.65 448 128V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V128C0 92.65 28.65 64 64 64H104V24C104 10.75 114.7 0 128 0C141.3 0 152 10.75 152 24V64zM48 448C48 456.8 55.16 464 64 464H384C392.8 464 400 456.8 400 448V192H48V448z"
                            />
                        </svg>
                        {getRelativeTime(annotation.created_at * 1000)}
                    </div> */}
                </div>
            ) : (
                <div className="text-base"> </div>
            )}
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
            className={clsx("flex-grow overflow-hidden text-ellipsis leading-normal", className)}
            style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: rows,
            }}
        >
            {text}
        </div>
    );
}
