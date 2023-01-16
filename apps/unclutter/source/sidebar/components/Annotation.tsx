import React from "react";
import type { LindyAnnotation } from "../../common/annotations/create";
import { getRandomColor } from "../../common/annotations/styling";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { openArticleResilient } from "@unclutter/library-components/dist/common/extension";
import clsx from "clsx";

interface AnnotationProps {
    className?: string;
    style?: React.CSSProperties;
    annotation: LindyAnnotation;
    heightLimitPx?: number;

    deleteHide: () => void;
}

function Annotation({ className, style, annotation, heightLimitPx }: AnnotationProps) {
    const { excerpt, text, platform, infoType, score, author } = annotation;

    let color: string;
    if (platform === "info") {
        color = `rgba(250, 204, 21, ${0.8 * score ** 3})`;
    } else if (platform === "hn") {
        color = "rgba(255, 102, 0, 0.5)";
    } else if (platform === "h") {
        color = "rgba(189, 28, 43, 0.5)";
    } else if (platform === "related") {
        color = getRandomColor(annotation.relatedId);
    }

    return (
        <a
            className={clsx(
                "annotation relative flex cursor-pointer flex-col gap-2 overflow-hidden rounded-l-sm rounded-r-md p-2 px-3 text-sm shadow transition-transform hover:scale-[99%]",
                className
            )}
            style={{
                borderLeft: `8px solid ${color}`,
                maxHeight: heightLimitPx,
                ...style,
            }}
            onClick={(e) => {
                if (annotation.article?.url) {
                    e.preventDefault();
                    e.stopPropagation();

                    openArticleResilient(annotation.article.url, true, annotation.id);
                }

                reportEventContentScript("expandAnnotation", {
                    platform: annotation.platform,
                });
            }}
            href={annotation.link || annotation.article?.url}
            target="_blank"
            rel="noreferrer"
        >
            <div
                className="annotation-text select-none"
                style={{
                    display: "-webkit-box",
                    // restrict text height by whole lines
                    // assumes 20px font size and py-1.5 padding
                    WebkitLineClamp: Math.min(
                        10
                        // heightLimitPx ? Math.floor((heightLimitPx - 6 * 2 - 20) / 20) : Infinity,
                    ),
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {/* {text.split(/<a>|<code>/).map((token) => {
                    if (token.startsWith("http")) {
                        return <AbbreviatedLink key={token} href={token} />;
                    }
                    if (token.startsWith("  ")) {
                        return (
                            <>
                                <code className="bg-gray-100">{token}</code>
                                <br />
                            </>
                        );
                    }
                    return token;
                })} */}
                "{excerpt || text}" {score?.toFixed(2)} {annotation.score2?.toFixed(2)}
            </div>

            <div className="annotation-bar font-title relative flex select-none items-center gap-2 overflow-hidden whitespace-nowrap">
                {(platform === "info" || platform === "related") && annotation.article?.url && (
                    <img
                        className="w-4 shrink-0 rounded-sm"
                        src={`https://www.google.com/s2/favicons?sz=128&domain=https://${getDomain(
                            annotation.article.url
                        )}`}
                    />
                )}
                {platform == "h" && (
                    <img src="../assets/icons/hypothesis.svg" className="w-4 rounded-sm" />
                )}
                {platform == "hn" && (
                    <img src="../assets/icons/yc.svg" className="w-4 rounded-sm" />
                )}

                {annotation.article && (
                    <div className="flex-grow overflow-hidden overflow-ellipsis">
                        {annotation.article.title}
                    </div>
                )}
                {annotation.author && <div className="">{author?.replace("_hn", "")}</div>}

                {annotation.reply_count > 0 && (
                    <div className="ml-2">
                        {annotation.reply_count}
                        {annotation.reply_count === 1 ? " reply" : " replies"}
                    </div>
                )}
            </div>
        </a>
    );
}
export default Annotation;

function AbbreviatedLink({ href }) {
    return (
        <a className="text-blue-400 hover:underline" href={href} target="_blank" rel="noreferrer">
            {getDomain(href)}/...
        </a>
    );
}

export function getDomain(url: string) {
    return url.match(/:\/\/(?:www\.)?(.[^/]+)/)[1];
}

export function parseDate(timestamp) {
    // Safari has issues with some formats
    // See https://stackoverflow.com/questions/6427204/date-parsing-in-javascript-is-different-between-safari-and-chrome
    return new Date(
        timestamp
            ?.replace(/-/g, "/")
            .replace(/[a-z]+/gi, " ")
            .replace(".000", "")
    );
}
