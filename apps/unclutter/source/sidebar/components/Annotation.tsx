import React, { useState } from "react";
import type { LindyAnnotation } from "../../common/annotations/create";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import { openArticleResilient } from "@unclutter/library-components/dist/common/extension";
import clsx from "clsx";
import { HighlightDropdown } from "@unclutter/library-components/dist/components/Dropdown/HighlightDowndown";

interface AnnotationProps {
    className?: string;
    style?: React.CSSProperties;
    annotation: LindyAnnotation;
    heightLimitPx?: number;

    color: string;
    colorDark?: string;
}

function Annotation({
    className,
    style,
    annotation,
    heightLimitPx,
    color,
    colorDark,
}: AnnotationProps) {
    const { excerpt, text, platform, infoType, score, author } = annotation;

    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <a
            className={clsx(
                "annotation relative flex cursor-pointer flex-col gap-2 overflow-hidden rounded-md p-2 pl-3 text-sm shadow transition-transform hover:scale-[99%]",
                className
            )}
            style={{
                borderLeft: `8px solid ${color}`,
                // @ts-ignore
                "--dark-border-color": colorDark || color,
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
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropdownOpen(true);
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
                        4
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
                {/* {score?.toFixed(2)} {annotation.score2?.toFixed(2)} */}
                {excerpt || text}
            </div>

            {/* <div className="annotation-bar relative flex select-none items-center gap-2 overflow-hidden whitespace-nowrap font-medium opacity-75">
                {(platform === "info" || platform === "related") && annotation.article?.url && (
                    // <svg className="h-4" viewBox="0 0 640 512">
                    //     <path
                    //         fill="currentColor"
                    //         d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                    //     />
                    // </svg>
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
            </div> */}

            {/* <HighlightDropdown
                annotation={annotation}
                open={dropdownOpen}
                setOpen={setDropdownOpen}
            /> */}
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
