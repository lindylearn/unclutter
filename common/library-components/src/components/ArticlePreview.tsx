import React, { createContext, useEffect } from "react";
import clsx from "clsx";
import { useContext, useLayoutEffect, useState } from "react";

import { Article, readingProgressFullClamp } from "../store/_schema";
import { ArticleDropdown } from "./Dropdown";
import { openArticleResilient } from "../common";
import { ResourceIcon } from "./Modal";

export type LocalScreenshotFetcher = ((articleId: string) => Promise<string | null>) | null;
export const LocalScreenshotContext = createContext<LocalScreenshotFetcher>(null);

interface ArticlePreviewProps {
    article: Article;
    listState: "static" | "active" | "dragging";
    listIndex?: number;
    small?: boolean;
    disableFavoriteShadow?: boolean;
    style?: object;
    className?: string;
    setNodeRef?: (el: HTMLElement) => void;
    reportEvent?: (event: string, properties?: any) => void;
}

export function ArticlePreview({
    article,
    listState,
    listIndex = 0,
    style = {},
    small = false,
    disableFavoriteShadow = false,
    setNodeRef = (el) => {},
    className = "",
    reportEvent = () => {},
    ...props
}: ArticlePreviewProps) {
    // const [ref, setRef] = useState<HTMLAnchorElement | null>(null);

    let readingProgress = article.reading_progress;
    if (readingProgress > readingProgressFullClamp) {
        readingProgress = 1;
    }

    function openPage(e) {
        e.preventDefault();
        e.stopPropagation();
        if (listState === "static") {
            openArticleResilient(article.url);
            reportEvent("clickListArticle");
        }
    }

    let publishYear = article.publication_date?.slice(0, 4);
    if (publishYear === "2022") {
        publishYear = undefined;
    }

    // animate hover via JS & CSS animation because transitions sometimes fail
    // const [isHover, setIsHover] = useState<boolean | null>(null);
    // useLayoutEffect(() => {
    //     setIsHover(null);
    // }, [listState]);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const localScreenshotFetcher = useContext(LocalScreenshotContext);
    const [backgroundSrc, setBackgroundSrc] = useState<string | undefined>(
        !article.is_temporary
            ? `url(https://storage.googleapis.com/unclutter-screenshots-serverless/articles/current/${encodeURIComponent(
                  article.url
              ).replaceAll("%", "%25")}.webp)`
            : undefined
    );
    useEffect(() => {
        if (localScreenshotFetcher) {
            localScreenshotFetcher(article.id).then((base64) => {
                if (base64) {
                    setBackgroundSrc(`url(${base64})`);
                }
            });
        }
    }, [localScreenshotFetcher]);

    return (
        <a
            className={clsx(
                "article-container relative block flex-shrink-0 cursor-pointer overflow-hidden bg-white text-base text-gray-800 transition-shadow dark:text-black dark:brightness-90",
                small
                    ? "hover:shadow-articleSmallHover shadow-articleSmall h-40 w-36 rounded-md"
                    : "hover:shadow-articleHover shadow-article h-52 w-44 rounded-lg",
                listState === "active" && "article-active opacity-0 transition-none",
                // listState === "static" && "article-static",
                // listState === "dragging" && "article-dragging",
                // listIndex % 3 && "rotate-neg",
                // isHover === true && "is-hover",
                // isHover === false && "hover-leave",
                className
            )}
            onClick={openPage}
            href={article.url}
            // onMouseEnter={(el) => {
            //     const target = el.target as HTMLElement;
            //     if (!target.classList.contains("dropdown-elem")) {
            //         setIsHover(true);
            //     }
            // }}
            // onMouseLeave={() => setIsHover(false)}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen(true);
            }}
            ref={(el) => {
                setNodeRef(el as HTMLElement);
                // setRef(el);
            }}
            style={style}
            {...props}
        >
            <div className="article-fallback flex max-h-full flex-col gap-2 overflow-hidden py-2 px-3">
                <div
                    className="font-text min-h-[35px] shrink-0 select-none overflow-hidden text-ellipsis text-sm font-medium leading-tight"
                    style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                    }}
                >
                    {article.title}
                </div>
                {article.description && (
                    <div className="font-text select-none overflow-hidden text-ellipsis text-xs font-normal leading-tight">
                        {article.description}
                    </div>
                )}
            </div>
            <div
                className="article-image absolute top-0 left-0 h-full w-full"
                style={{
                    backgroundImage: backgroundSrc,
                    backgroundSize: "cover",
                }}
            ></div>

            {/* <div
                className={clsx(
                    "article-gradient absolute bottom-0 left-0 h-full w-full"
                )}
            ></div> */}

            {!article.is_temporary && (
                <ArticleDropdown
                    article={article}
                    open={dropdownOpen}
                    setOpen={setDropdownOpen}
                    small={small}
                    reportEvent={reportEvent}
                />
            )}

            <svg
                viewBox="0 0 576 512"
                className={clsx(
                    "text-lindy dark:text-lindyDark absolute bottom-3 right-1.5 w-5 text-right drop-shadow-sm transition-all",
                    !article.is_favorite && "opacity-0"
                )}
            >
                <path
                    fill="currentColor"
                    d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"
                />
            </svg>

            {publishYear && (
                <div className="bg-lindy absolute bottom-3 left-2 select-none rounded-lg px-1.5 text-sm font-medium text-stone-800">
                    {publishYear}
                </div>
            )}

            {article.annotation_count ? (
                <div className="font-title absolute bottom-2.5 right-0 flex select-none items-center gap-1.5 rounded-lg bg-[rgba(255,255,255,50%)] px-1.5 text-base font-bold text-stone-800">
                    <ResourceIcon type="highlights" />
                    {article.annotation_count}
                </div>
            ) : (
                <></>
            )}

            <div
                className="bg-lindy dark:bg-lindyDark absolute bottom-0 left-0 h-[7px] rounded-r transition-all"
                style={{
                    // disabled progress animation as it sometimes re-renders during dragging
                    width: `${readingProgress * 100}%`,
                }}
            />
            {/* {readingProgress < readingProgressFullClamp && (
                <div className="absolute bottom-0 left-0 w-full pr-2 pb-0.5 text-right text-sm">
                    {Math.round(article.word_count / 200)} min
                </div>
            )} */}
        </a>
    );
}
