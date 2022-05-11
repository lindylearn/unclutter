import React from "react";
import { getAnnotationColor } from "../../common/annotations/styling";

function Annotation({
    annotation,
    className,
    charLimit = 200,
    upvoted,
    upvoteAnnotation,
    onHoverUpdate,
    deleteHideAnnotation,
    showReplyCount,
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
                "annotation p-1 px-2 bg-white text-gray-800 rounded shadow-sm hover:shadow animate-slidein transition-all relative " +
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

            <div className="top-icons absolute top-1 right-1 p-1 flex gap-3 text-gray-400 transition-all">
                <div
                    className="cursor-pointer hover:text-gray-600 hover:scale-110"
                    onClick={deleteHideAnnotation}
                >
                    <svg className="icon h-3.5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM92.93 126.9C64.8 162.3 48 207.2 48 256C48 370.9 141.1 464 256 464C304.8 464 349.7 447.2 385.1 419.1L92.93 126.9zM464 256C464 141.1 370.9 48 256 48C207.2 48 162.3 64.8 126.9 92.93L419.1 385.1C447.2 349.7 464 304.8 464 256z"
                        />
                    </svg>
                </div>
            </div>

            <div className="info-bar text-sm text-gray-400 flex gap-3 justify-between transition-all">
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

                {showReplyCount && annotation.reply_count !== 0 && (
                    <a
                        className="select-none hover:text-gray-700 hover:scale-110 transition-all"
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
                            {annotation.reply_count}{" "}
                            {annotation.reply_count === 1 ? "reply" : "replies"}
                        </span>
                    </a>
                )}

                {!showReplyCount && annotation.platform === "h" && (
                    <a
                        className="reply-button invisible select-none hover:text-gray-700 hover:scale-110 transition-all"
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
                )}

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
                    className=""
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
