import React from "react";
import { getAnnotationColor } from "../../common/annotations/styling";

function Annotation({
    annotation,
    className,
    charLimit = 200,
    upvoted,
    upvoteAnnotation,
    onHoverUpdate,
    animationIndex,
}) {
    const { text, offset, author, platform, link, reply_count } = annotation;

    const textLines = text
        .slice(0, charLimit)
        .split("\n")
        .filter((line) => line.trim() != "");

    const [upvoteCount, setLocalUpvoteCount] = React.useState(
        annotation.upvote_count || 0
    );
    function toggleUpvoteAnnotationLocalFirst() {
        const newCount = upvoteCount + (upvoted ? -1 : 1);
        upvoteAnnotation(!upvoted);
        setLocalUpvoteCount(newCount);
    }

    return (
        <div
            className={
                "annotation p-1 px-2 bg-white text-gray-800 rounded shadow-sm hover:shadow animate-slidein transition-all " +
                className
            }
            style={{
                top: offset,
                borderColor: getAnnotationColor(annotation),
                // animationDelay: `${animationIndex * 100}ms`,
            }}
            onMouseEnter={() => onHoverUpdate(true)}
            onMouseLeave={() => onHoverUpdate(false)}
        >
            <a
                className="text-sm leading-normal"
                href={link}
                target="_blank"
                rel="noreferrer"
            >
                {textLines.map((line, i) => {
                    return (
                        <p key={i} className="mb-1">
                            {line}
                            {i == textLines.length - 1 &&
                            text.length > charLimit ? (
                                "..."
                            ) : (
                                <br className="" />
                            )}
                        </p>
                    );
                })}
            </a>
            <div className="info-bar text-sm text-gray-400 flex gap-3 justify-between transition-all">
                <div
                    className={
                        "upvote-button flex-shrink-0 flex cursor-pointer select-none hover:text-gray-600 hover:scale-110 transition-all " +
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
                </div>

                <a
                    className="reply-button invisible select-none hover:text-gray-600 hover:scale-110 transition-all"
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
                    <span>reply</span>
                </a>

                <div className="flex-grow" />
                <a
                    href={
                        platform === "h"
                            ? `https://annotations.lindylearn.io/@${
                                  author.username || author
                              }`
                            : `https://news.ycombinator.com/user?id=${
                                  author.username || author
                              }`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="userlink"
                >
                    {author.username || author}
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
                </a>
            </div>
        </div>
    );
}
export default Annotation;
