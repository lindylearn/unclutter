import React from "react";
import { getRandomLightColor, openArticleResilient } from "../common";
import { Annotation, Article } from "../store";
import { ResourceIcon } from "./Modal";

export function Highlight({
    annotation,
    article,
    darkModeEnabled,
}: {
    annotation: Annotation;
    article: Article | undefined;
    darkModeEnabled: boolean;
}) {
    return (
        <a
            className="animate-fadein relative flex cursor-pointer select-none flex-col justify-between gap-3 overflow-hidden rounded-md p-3 text-sm text-stone-900 transition-all hover:scale-[99%]"
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
        >
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

            <div className="dropdown-icon absolute top-0 right-0.5 cursor-pointer p-1.5 outline-none transition-all hover:scale-110">
                <svg className="w-3" viewBox="0 0 384 512">
                    <path
                        fill="currentColor"
                        d="M360.5 217.5l-152 143.1C203.9 365.8 197.9 368 192 368s-11.88-2.188-16.5-6.562L23.5 217.5C13.87 208.3 13.47 193.1 22.56 183.5C31.69 173.8 46.94 173.5 56.5 182.6L192 310.9l135.5-128.4c9.562-9.094 24.75-8.75 33.94 .9375C370.5 193.1 370.1 208.3 360.5 217.5z"
                    />
                </svg>
            </div>
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
