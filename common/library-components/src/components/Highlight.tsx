import clsx from "clsx";
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
                <div className="animate-fadein flex items-center justify-between gap-2 whitespace-nowrap">
                    {/* <ResourceIcon type="articles_completed" /> */}
                    <div className="text-medium overflow-hidden text-ellipsis text-base">
                        {article?.title}
                    </div>
                    {/* <div className="text-stone-600">
                    {getRelativeTime(annotation.created_at * 1000)}
                </div> */}

                    <svg
                        viewBox="0 0 576 512"
                        className={clsx(
                            "text-lindy dark:text-lindyDark -mt-0.5 w-5 transition-opacity",
                            !annotation.is_favorite && "opacity-0"
                        )}
                    >
                        <path
                            fill="currentColor"
                            d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
                        />
                    </svg>
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
