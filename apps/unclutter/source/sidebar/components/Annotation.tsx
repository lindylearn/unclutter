import React, { useEffect, useRef } from "react";
import { LindyAnnotation } from "../../common/annotations/create";
import { getAnnotationColor } from "../../common/annotations/styling";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";

interface AnnotationProps {
    annotation: LindyAnnotation;
    className?: string;
    heightLimitPx?: number;
    showingReplies: boolean;
    isReply: boolean;
    isRelated: boolean;

    hypothesisSyncEnabled: boolean;
    deleteHide: () => void;
    unfocusAnnotation: (annotation: LindyAnnotation) => void;
    createReply: () => void;
}

function Annotation({
    annotation,
    className,
    heightLimitPx,
    showingReplies,
    hypothesisSyncEnabled,
    isReply,
    isRelated,
    createReply,
    unfocusAnnotation,
    deleteHide,
}: AnnotationProps) {
    const { text, author, platform, link, reply_count } = annotation;

    const [upvoteCount, setLocalUpvoteCount] = React.useState(annotation.upvote_count || 0);
    // function toggleUpvoteAnnotationLocalFirst() {
    //     const newCount = upvoteCount + (upvoted ? -1 : 1);
    //     upvoteAnnotation(!upvoted);
    //     setLocalUpvoteCount(newCount);
    // }

    // const relativeTime = formatRelativeTime(parseDate(annotation.created_at));

    const ref = useBlurRef(annotation, unfocusAnnotation);

    return (
        <div
            className={
                "annotation relative overflow-hidden rounded-md bg-white px-3 py-2 text-xs text-gray-800 shadow " +
                className
            }
            style={{
                borderColor: getAnnotationColor(annotation),
                maxHeight: heightLimitPx,
            }}
            ref={ref}
            onClick={() => {
                onExpand(annotation);
            }}
        >
            <div
                className="annotation-text select-none"
                style={{
                    display: "-webkit-box",
                    // restrict text height by whole lines
                    // assumes 20px font size and py-1.5 padding
                    WebkitLineClamp: Math.min(
                        heightLimitPx ? Math.floor((heightLimitPx - 6 * 2 - 20) / 20) : Infinity,
                        isReply ? 3 : 6
                    ),
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {/* @ts-ignore */}
                {/* {annotation.score.toString().slice(0, 4)}{" "} */}
                {text.split(/<a>|<code>/).map((token) => {
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
                })}
            </div>

            {isRelated && (
                <div
                    className="annotation-bar relative mt-2 flex cursor-pointer select-none items-center gap-2 overflow-hidden whitespace-nowrap text-gray-800 transition-transform hover:scale-[99%]"
                    style={
                        {
                            // backgroundColor: getAnnotationColor(annotation),
                        }
                    }
                    ref={ref}
                >
                    <svg className="-mt-0.5 w-4 shrink-0" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M512 288c0 35.35-21.49 64-48 64c-32.43 0-31.72-32-55.64-32C394.9 320 384 330.9 384 344.4V480c0 17.67-14.33 32-32 32h-71.64C266.9 512 256 501.1 256 487.6C256 463.1 288 464.4 288 432c0-26.51-28.65-48-64-48s-64 21.49-64 48c0 32.43 32 31.72 32 55.64C192 501.1 181.1 512 167.6 512H32c-17.67 0-32-14.33-32-32v-135.6C0 330.9 10.91 320 24.36 320C48.05 320 47.6 352 80 352C106.5 352 128 323.3 128 288S106.5 223.1 80 223.1c-32.43 0-31.72 32-55.64 32C10.91 255.1 0 245.1 0 231.6v-71.64c0-17.67 14.33-31.1 32-31.1h135.6C181.1 127.1 192 117.1 192 103.6c0-23.69-32-23.24-32-55.64c0-26.51 28.65-47.1 64-47.1s64 21.49 64 47.1c0 32.43-32 31.72-32 55.64c0 13.45 10.91 24.36 24.36 24.36H352c17.67 0 32 14.33 32 31.1v71.64c0 13.45 10.91 24.36 24.36 24.36c23.69 0 23.24-32 55.64-32C490.5 223.1 512 252.7 512 288z"
                        />
                    </svg>
                    {/* <img
                        className="w-4 shrink-0 rounded-sm"
                        src={`https://www.google.com/s2/favicons?sz=128&domain=https://${groupKey}`}
                    /> */}
                    <div className="flex-grow overflow-hidden overflow-ellipsis">
                        {/* @ts-ignore */}
                        {annotation.title}
                    </div>
                    <svg className="w-4 shrink-0" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M264.6 70.63l176 168c4.75 4.531 7.438 10.81 7.438 17.38s-2.688 12.84-7.438 17.38l-176 168c-9.594 9.125-24.78 8.781-33.94-.8125c-9.156-9.5-8.812-24.75 .8125-33.94l132.7-126.6H24.01c-13.25 0-24.01-10.76-24.01-24.01s10.76-23.99 24.01-23.99h340.1l-132.7-126.6C221.8 96.23 221.5 80.98 230.6 71.45C239.8 61.85 254.1 61.51 264.6 70.63z"
                        />
                    </svg>
                </div>
            )}

            {/* <div className="info-bar mt-0.5 flex items-end justify-between gap-3 text-sm text-gray-400 transition-all">
                {!showingReplies && annotation.reply_count > 0 && (
                    <div className="cursor-pointer select-none transition-all">
                        <svg
                            className="mr-1 inline-block w-3 rotate-180 align-baseline"
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
                            {annotation.reply_count === 1 ? " reply" : " replies"}
                        </span>
                    </div>
                )}

                <div className="flex-grow" />
                <div className="flex-shrink-0 select-none">
                    <>
                        {author?.replace("_hn", "")}
                        {platform == "h" && (
                            <img
                                src="../assets/icons/hypothesis.svg"
                                className="ml-1 inline-block w-3"
                            />
                        )}
                        {platform == "hn" && (
                            <img
                                src="../assets/icons/yc.svg"
                                className="ml-1 mb-0.5 inline-block w-3"
                            />
                        )}
                    </>
                </div>
            </div> */}
        </div>
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

function onExpand(annotation: LindyAnnotation) {
    reportEventContentScript("expandSocialHighlight", {
        platform: annotation.platform,
        reply_count: annotation.reply_count,
    });
}

export function useBlurRef(
    annotation: LindyAnnotation,
    unfocusAnnotation: (annotation: LindyAnnotation) => void
) {
    // if annotation focused, detect clicks to unfocus it
    const ref = useRef<HTMLDivElement>();
    useEffect(() => {
        if (annotation.focused) {
            const onClick = (e) => {
                const clickTarget: HTMLElement = e.target;

                // ignore actions performed on other annotations (e.g. deletes)
                if (clickTarget.classList.contains("icon")) {
                    return;
                }

                if (ref.current && !ref.current.contains(clickTarget)) {
                    unfocusAnnotation(annotation);
                }
            };

            document.addEventListener("click", onClick, true);
            return () => {
                document.removeEventListener("click", onClick, true);
            };
        }
    }, [annotation.focused]);

    return ref;
}
