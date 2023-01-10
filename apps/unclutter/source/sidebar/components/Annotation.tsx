import React from "react";
import type { LindyAnnotation } from "../../common/annotations/create";
import { getAnnotationColor } from "../../common/annotations/styling";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";

interface AnnotationProps {
    annotation: LindyAnnotation;
    heightLimitPx?: number;

    deleteHide: () => void;
}

function Annotation({ annotation, heightLimitPx }: AnnotationProps) {
    const { text, platform, infoType } = annotation;

    return (
        <div
            className="annotation relative flex flex-col overflow-hidden rounded-l rounded-r-md p-1 pl-2 text-sm text-gray-800 shadow"
            style={{
                borderLeft: `8px solid rgba(250, 204, 21, ${0.8 * (annotation.score + 0.1) ** 3})`,
                maxHeight: heightLimitPx,
            }}
            onClick={() => {
                onExpand(annotation);
            }}
        >
            <div
                className="annotation-text select-none p-1"
                style={{
                    display: "-webkit-box",
                    // restrict text height by whole lines
                    // assumes 20px font size and py-1.5 padding
                    WebkitLineClamp: Math.min(
                        10,
                        // heightLimitPx ? Math.floor((heightLimitPx - 6 * 2 - 20) / 20) : Infinity,
                        3
                    ),
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
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

            <div className="annotation-bar relative flex cursor-pointer select-none items-center gap-2 overflow-hidden whitespace-nowrap p-1 text-gray-800">
                {platform === "info" && infoType === "related" && (
                    <svg className="w-4 shrink-0" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M512 288c0 35.35-21.49 64-48 64c-32.43 0-31.72-32-55.64-32C394.9 320 384 330.9 384 344.4V480c0 17.67-14.33 32-32 32h-71.64C266.9 512 256 501.1 256 487.6C256 463.1 288 464.4 288 432c0-26.51-28.65-48-64-48s-64 21.49-64 48c0 32.43 32 31.72 32 55.64C192 501.1 181.1 512 167.6 512H32c-17.67 0-32-14.33-32-32v-135.6C0 330.9 10.91 320 24.36 320C48.05 320 47.6 352 80 352C106.5 352 128 323.3 128 288S106.5 223.1 80 223.1c-32.43 0-31.72 32-55.64 32C10.91 255.1 0 245.1 0 231.6v-71.64c0-17.67 14.33-31.1 32-31.1h135.6C181.1 127.1 192 117.1 192 103.6c0-23.69-32-23.24-32-55.64c0-26.51 28.65-47.1 64-47.1s64 21.49 64 47.1c0 32.43-32 31.72-32 55.64c0 13.45 10.91 24.36 24.36 24.36H352c17.67 0 32 14.33 32 31.1v71.64c0 13.45 10.91 24.36 24.36 24.36c23.69 0 23.24-32 55.64-32C490.5 223.1 512 252.7 512 288z"
                        />
                    </svg>
                )}
                {platform === "info" && infoType === "link" && (
                    <svg className="w-4 shrink-0" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M264.6 70.63l176 168c4.75 4.531 7.438 10.81 7.438 17.38s-2.688 12.84-7.438 17.38l-176 168c-9.594 9.125-24.78 8.781-33.94-.8125c-9.156-9.5-8.812-24.75 .8125-33.94l132.7-126.6H24.01c-13.25 0-24.01-10.76-24.01-24.01s10.76-23.99 24.01-23.99h340.1l-132.7-126.6C221.8 96.23 221.5 80.98 230.6 71.45C239.8 61.85 254.1 61.51 264.6 70.63z"
                        />
                    </svg>
                )}
                {(platform === "hn" || platform === "h") && (
                    <svg className="w-4 shrink-0" viewBox="0 0 640 512">
                        <path
                            fill="currentColor"
                            d="M319.9 320c57.41 0 103.1-46.56 103.1-104c0-57.44-46.54-104-103.1-104c-57.41 0-103.1 46.56-103.1 104C215.9 273.4 262.5 320 319.9 320zM319.9 160c30.85 0 55.96 25.12 55.96 56S350.7 272 319.9 272S263.9 246.9 263.9 216S289 160 319.9 160zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM369.9 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2C499.3 512 512 500.1 512 485.3C512 411.7 448.4 352 369.9 352zM178.1 464c10.47-36.76 47.36-64 91.14-64H369.9c43.77 0 80.66 27.24 91.14 64H178.1zM551.9 192h-61.84c-12.8 0-24.88 3.037-35.86 8.24C454.8 205.5 455.8 210.6 455.8 216c0 33.71-12.78 64.21-33.16 88h199.7C632.1 304 640 295.6 640 285.3C640 233.8 600.6 192 551.9 192zM183.9 216c0-5.449 .9824-10.63 1.609-15.91C174.6 194.1 162.6 192 149.9 192H88.08C39.44 192 0 233.8 0 285.3C0 295.6 7.887 304 17.62 304h199.5C196.7 280.2 183.9 249.7 183.9 216zM128 160c44.18 0 80-35.82 80-80S172.2 0 128 0C83.82 0 48 35.82 48 80S83.82 160 128 160z"
                        />
                    </svg>
                )}

                {/* <img
                        className="w-4 shrink-0 rounded-sm"
                        src={`https://www.google.com/s2/favicons?sz=128&domain=https://${groupKey}`}
                    /> */}
                <div className="flex-grow overflow-hidden overflow-ellipsis">
                    {/* @ts-ignore */}
                    {annotation.title}
                </div>
            </div>
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
