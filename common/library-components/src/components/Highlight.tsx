import clsx from "clsx";
import React, { useContext, useState } from "react";
import { getDomain, getRandomLightColor, openArticleResilient, sendMessage } from "../common";
import { Annotation, Article } from "../store";
import { HighlightDropdown } from "./Dropdown/HighlightDowndown";
import { ModalVisibilityContext } from "./Modal/context";

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
    const { closeModal } = useContext(ModalVisibilityContext);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    function openHighlight(e) {
        e.preventDefault();
        e.stopPropagation();

        if (isCurrentArticle) {
            closeModal?.();
            sendMessage({ event: "focusAnnotation", annotationId: annotation.id, source: "modal" });
        } else if (article?.url) {
            // open new tab & scroll to highlight
            openArticleResilient(article.url, true, annotation.id);
        }

        reportEvent("openHighlight", { isCurrentArticle });
    }

    return (
        <div
            className="highlight animate-fadein relative flex cursor-pointer select-none flex-col gap-2 overflow-hidden rounded-md bg-white px-4 py-3 text-sm text-stone-900 shadow transition-transform hover:scale-[99%] dark:text-white"
            onClick={openHighlight}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen(true);
            }}
        >
            <HighlightDropdown
                annotation={annotation}
                article={article}
                open={dropdownOpen}
                setOpen={setDropdownOpen}
            />

            <LimitedText
                className={clsx("flex-grow leading-normal")}
                text={annotation.text || annotation.quote_text}
                rows={6}
            />

            {/* <div>
                {annotation.score?.toFixed(2)}
                {annotation.score2?.toFixed(2)}
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
