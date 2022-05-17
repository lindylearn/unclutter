import React from "react";
import { LindyAnnotation } from "../../common/annotations/create";
import { getAnnotationColor } from "../../common/annotations/styling";

interface AnnotationProps {
    annotation: LindyAnnotation;
    className?: string;
    heightLimitPx: number;
    showingReplies: boolean;
    isReply: boolean;

    hypothesisSyncEnabled: boolean;
    deleteHide: () => void;
    onHoverUpdate: (hoverActive: boolean) => void;
    createReply: () => void;
}

function Annotation({
    annotation,
    className,
    heightLimitPx,
    showingReplies,
    hypothesisSyncEnabled,
    isReply,
    createReply,
    onHoverUpdate,
    deleteHide,
}: AnnotationProps) {
    const { text, author, platform, link, reply_count } = annotation;

    const textLines = text.split("\n").filter((line) => line.trim() != "");

    const [upvoteCount, setLocalUpvoteCount] = React.useState(
        annotation.upvote_count || 0
    );
    // function toggleUpvoteAnnotationLocalFirst() {
    //     const newCount = upvoteCount + (upvoted ? -1 : 1);
    //     upvoteAnnotation(!upvoted);
    //     setLocalUpvoteCount(newCount);
    // }

    // const relativeTime = formatRelativeTime(parseDate(annotation.created_at));

    return (
        <div
            className={
                "annotation px-2.5 py-1.5 bg-white text-gray-800 rounded shadow-sm hover:shadow animate-slidein transition-all relative " +
                className
            }
            style={{
                borderColor: getAnnotationColor(annotation),
                maxHeight: heightLimitPx,
            }}
            onMouseEnter={() => onHoverUpdate(true)}
            onMouseLeave={() => onHoverUpdate(false)}
        >
            <a
                className="annotation-text text-sm select-none mr-3"
                style={{
                    display: "-webkit-box",
                    // restrict text height by whole lines
                    // assumes 20px font size and py-1.5 padding
                    WebkitLineClamp: Math.min(
                        Math.floor((heightLimitPx - 6 * 2 - 20) / 20),
                        isReply ? 3 : 5
                    ),
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                href={link}
                target="_blank"
                rel="noreferrer"
            >
                {!isReply && (
                    <div
                        className={
                            "crowd-annotation-dot mr-1.5 " + annotation.platform
                        }
                    />
                )}
                {textLines.flatMap((line, lineIndex) =>
                    line
                        .split(/<a>|<code>/)
                        .map((token) => {
                            if (token.startsWith("http")) {
                                return (
                                    <AbbreviatedLink key={token} href={token} />
                                );
                            }
                            if (token.startsWith("  ")) {
                                return (
                                    <>
                                        <code className="bg-gray-100 text-sm">
                                            {token}
                                        </code>
                                        <br />
                                    </>
                                );
                            }
                            return token;
                        })
                        .concat([<br key={lineIndex} />])
                )}
            </a>

            <div className="top-icons absolute top-1 right-1 p-1 flex gap-3 text-gray-400">
                <div
                    className="cursor-pointer hover:text-gray-600 hover:drop-shadow lindy-tooltip lindy-fade transition-all"
                    onClick={deleteHide}
                    data-title="Hide comment"
                >
                    <svg className="icon h-3.5" viewBox="0 0 640 512">
                        <path
                            fill="currentColor"
                            d="M150.7 92.77C195 58.27 251.8 32 320 32C400.8 32 465.5 68.84 512.6 112.6C559.4 156 590.7 207.1 605.5 243.7C608.8 251.6 608.8 260.4 605.5 268.3C592.1 300.6 565.2 346.1 525.6 386.7L630.8 469.1C641.2 477.3 643.1 492.4 634.9 502.8C626.7 513.2 611.6 515.1 601.2 506.9L9.196 42.89C-1.236 34.71-3.065 19.63 5.112 9.196C13.29-1.236 28.37-3.065 38.81 5.112L150.7 92.77zM189.8 123.5L235.8 159.5C258.3 139.9 287.8 128 320 128C390.7 128 448 185.3 448 256C448 277.2 442.9 297.1 433.8 314.7L487.6 356.9C521.1 322.8 545.9 283.1 558.6 256C544.1 225.1 518.4 183.5 479.9 147.7C438.8 109.6 385.2 79.1 320 79.1C269.5 79.1 225.1 97.73 189.8 123.5L189.8 123.5zM394.9 284.2C398.2 275.4 400 265.9 400 255.1C400 211.8 364.2 175.1 320 175.1C319.3 175.1 318.7 176 317.1 176C319.3 181.1 320 186.5 320 191.1C320 202.2 317.6 211.8 313.4 220.3L394.9 284.2zM404.3 414.5L446.2 447.5C409.9 467.1 367.8 480 320 480C239.2 480 174.5 443.2 127.4 399.4C80.62 355.1 49.34 304 34.46 268.3C31.18 260.4 31.18 251.6 34.46 243.7C44 220.8 60.29 191.2 83.09 161.5L120.8 191.2C102.1 214.5 89.76 237.6 81.45 255.1C95.02 286 121.6 328.5 160.1 364.3C201.2 402.4 254.8 432 320 432C350.7 432 378.8 425.4 404.3 414.5H404.3zM192 255.1C192 253.1 192.1 250.3 192.3 247.5L248.4 291.7C258.9 312.8 278.5 328.6 302 333.1L358.2 378.2C346.1 381.1 333.3 384 319.1 384C249.3 384 191.1 326.7 191.1 255.1H192z"
                        />
                    </svg>
                </div>
            </div>

            {/* <div className="spacer-line border-b-2 border-gray-100 -mx-3 my-1"></div> */}

            <div className="info-bar mt-0.5 text-sm text-gray-400 flex gap-3 justify-between items-end transition-all">
                {/* <div
                    className={
                        "upvote-button flex-shrink-0 flex cursor-pointer select-none hover:text-gray-700 hover:scale-110 transition-all " +
                        (upvoted ? "text-gray-800 " : "") +
                        (upvoteCount == 0 ? "invisible " : "") // shown on hover through global CSS
                    }
                    onClick={toggleUpvoteAnnotationLocalFirst}
                >
                    <svg
                        className="inline-block align-baseline w-3 mr-1"
                        viewBox="0 0 320 512"
                    >
                        <path
                            fill="currentColor"
                            d="M177 159.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 255.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 329.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1z"
                        ></path>
                    </svg>
                    <span>{upvoteCount}</span>
                </div> */}

                {!showingReplies && annotation.reply_count !== 0 && (
                    <a
                        className="select-none hover:text-gray-700 hover:drop-shadow-sm transition-all cursor-pointer"
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <svg
                            className="inline-block align-baseline rotate-180 w-3 mr-1"
                            viewBox="0 0 512 512"
                            style={{ marginBottom: "-1px" }}
                        >
                            <path
                                fill="currentColor"
                                d="M8.309 189.836L184.313 37.851C199.719 24.546 224 35.347 224 56.015v80.053c160.629 1.839 288 34.032 288 186.258 0 61.441-39.581 122.309-83.333 154.132-13.653 9.931-33.111-2.533-28.077-18.631 45.344-145.012-21.507-183.51-176.59-185.742V360c0 20.7-24.3 31.453-39.687 18.164l-176.004-152c-11.071-9.562-11.086-26.753 0-36.328z"
                            ></path>
                        </svg>
                        <span>
                            {annotation.reply_count}
                            {annotation.reply_count === 1
                                ? " reply"
                                : " replies"}
                        </span>
                    </a>
                )}

                {(showingReplies || annotation.reply_count === 0) &&
                    annotation.platform === "h" &&
                    hypothesisSyncEnabled && (
                        <a
                            className="reply-button invisible select-none hover:text-gray-700 hover:scale-110 hover:pl-0.5 transition-all cursor-pointer"
                            onClick={showingReplies ? createReply : undefined}
                            href={!showingReplies ? link : undefined}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <svg
                                className="inline-block align-baseline rotate-180 w-3 mr-1"
                                viewBox="0 0 512 512"
                                style={{ marginBottom: "-1px" }}
                            >
                                <path
                                    fill="currentColor"
                                    d="M8.309 189.836L184.313 37.851C199.719 24.546 224 35.347 224 56.015v80.053c160.629 1.839 288 34.032 288 186.258 0 61.441-39.581 122.309-83.333 154.132-13.653 9.931-33.111-2.533-28.077-18.631 45.344-145.012-21.507-183.51-176.59-185.742V360c0 20.7-24.3 31.453-39.687 18.164l-176.004-152c-11.071-9.562-11.086-26.753 0-36.328z"
                                ></path>
                            </svg>
                            <span>reply</span>
                        </a>
                    )}

                {/* <div>{relativeTime}</div> */}

                <div className="flex-grow" />
                <a
                    className="hover:text-gray-700 hover:drop-shadow-sm select-none flex-shrink-0"
                    href={
                        platform === "h"
                            ? `https://annotations.lindylearn.io/@${author}`
                            : `https://news.ycombinator.com/user?id=${author.replace(
                                  "_hn",
                                  ""
                              )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                >
                    <>
                        {author.replace("_hn", "")}
                        {platform == "h" && (
                            <img
                                src="../assets/icons/hypothesis.svg"
                                className="inline-block w-3 ml-1"
                            />
                        )}
                        {platform == "hn" && (
                            <img
                                src="../assets/icons/yc.svg"
                                className="inline-block w-3 ml-1 mb-0.5"
                            />
                        )}
                    </>
                </a>
            </div>
        </div>
    );
}
export default Annotation;

function AbbreviatedLink({ href }) {
    return (
        <a
            className="text-blue-400 hover:underline"
            href={href}
            target="_blank"
            rel="noreferrer"
        >
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
            .replace(/-/g, "/")
            .replace(/[a-z]+/gi, " ")
            .replace(".000", "")
    );
}
