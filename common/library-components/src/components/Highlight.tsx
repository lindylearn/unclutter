import React, { useState } from "react";
import { getRandomLightColor, openArticleResilient } from "../common";
import { Annotation, Article } from "../store";
import { HighlightDropdown } from "./Dropdown/HighlightDowndown";
import { ResourceIcon } from "./Modal";

export function Highlight({
    annotation,
    article,
    darkModeEnabled,
    reportEvent = () => {},
}: {
    annotation: Annotation;
    article: Article | undefined;
    darkModeEnabled: boolean;
    reportEvent?: (event: string, properties?: any) => void;
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <a
            className="animate-fadein relative flex cursor-pointer select-none flex-col justify-between gap-3 overflow-hidden rounded-md p-3 text-sm text-stone-900 transition-all hover:shadow-lg"
            style={{
                background: getRandomLightColor(annotation.article_id, darkModeEnabled),
            }}
            href={article?.url}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (article?.url) {
                    openArticleResilient(article.url, true, annotation.id);
                }
            }}
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

            <QuoteText quote_text={annotation.quote_text} />

            {/* <textarea className="h-20 w-full rounded-md bg-stone-50 p-2" value={annotation.text} /> */}

            {article ? (
                <div className="animate-fadein flex items-center gap-2 whitespace-nowrap">
                    {/* <ResourceIcon type="articles_completed" /> */}
                    <div className="text-medium overflow-hidden text-ellipsis text-base">
                        {article?.title}
                    </div>
                    {/* <div className="text-stone-600">
                    {getRelativeTime(annotation.created_at * 1000)}
                </div> */}
                </div>
            ) : (
                <div className="text-base"> </div>
            )}
        </a>
    );
}

export function QuoteText({ quote_text }) {
    // const lines: string[] = useMemo(() => {
    //     if (!quote_text) {
    //         return [];
    //     }
    //     let text = quote_text?.length > 500 ? `${quote_text.slice(0, 500)} [...]` : quote_text;
    //     // text = `"${text}"`;

    //     return text
    //         .replace(/(\n)+/g, "\n")
    //         .split("\n")
    //         .filter((line) => line.trim() != "");
    // }, [quote_text]);

    return (
        <div
            className="flex-grow overflow-hidden text-ellipsis leading-normal"
            style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 6,
            }}
        >
            {quote_text}
        </div>
    );
}
