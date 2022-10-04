import clsx from "clsx";
import React, { ReactNode, useContext, useEffect, useState } from "react";

export function BigNumber({
    value,
    target,
    tag,
    colorOverride,
    icon,
    darkModeEnabled,
}: {
    value?: number;
    target?: number;
    tag: ReactNode;
    colorOverride?: string;
    icon?: ReactNode;
    darkModeEnabled?: boolean;
}) {
    return (
        <div className="relative flex select-none flex-col items-center overflow-hidden rounded-md bg-stone-50 p-3 transition-all hover:scale-[97%] dark:bg-neutral-800">
            {value !== undefined && target !== undefined && (
                <div
                    className="absolute top-0 left-0 h-full w-full opacity-90"
                    style={{
                        background: colorOverride || "rgb(237, 215, 91, 0.6)",
                        width: `${Math.min(1, value / target) * 100}%`,
                    }}
                />
            )}
            <div
                className={clsx(
                    "font-title z-10 flex h-[2rem] items-center gap-1.5 text-2xl font-bold transition-opacity",
                    value === undefined && "opacity-0"
                )}
            >
                {icon}
                <div>
                    {value}
                    {target && (
                        <span className="text-base opacity-20">
                            {" "}
                            / {target}
                        </span>
                    )}
                </div>
            </div>
            <div className="z-10 max-w-full overflow-hidden">{tag}</div>
        </div>
    );
}

export function ResourceStat({
    value,
    type,
    large = false,
    showPlus = false,
    className,
}: {
    value?: number;
    type: "articles" | "articles_completed" | "highlights";
    large?: boolean;
    showPlus?: boolean;
    className?: string;
}) {
    return (
        <div
            className={clsx(
                "relative flex items-center transition-opacity",
                large ? "gap-1.5" : "gap-1",
                value === undefined && "opacity-0",
                className
            )}
        >
            <ResourceIcon type={type} large={large} />
            <div
                className={clsx("font-title font-bold", large ? "text-xl" : "")}
            >
                {showPlus && "+"}
                {value || 0}
            </div>
        </div>
    );
}

export function ReadingProgress({
    articleCount,
    readCount,
    large = false,
    color,
    className,
}: {
    articleCount?: number;
    readCount?: number;
    unreadCount?: number;
    large?: boolean;
    color?: string;
    className?: string;
}) {
    const unreadCount = (articleCount || 0) - (readCount || 0);
    const progress =
        Math.max((readCount || 0) / (articleCount || 1), 0.05) * 100;

    return (
        <div
            className={clsx(
                "flex gap-3 overflow-hidden rounded-md transition-opacity",
                !articleCount && "opacity-0",
                large ? "px-2 py-0.5" : "px-1.5 py-0",
                className
            )}
        >
            <ResourceStat
                type="articles_completed"
                value={readCount}
                large={large}
            />
            <ResourceStat type="articles" value={unreadCount} large={large} />
            <div
                className="bg-lindy dark:bg-lindyDark absolute top-0 left-0 h-full"
                style={{
                    width: `${progress}%`,
                    background: color,
                }}
            />
        </div>
    );
}

export function ResourceIcon({
    type,
    large = false,
    className,
}: {
    type: "articles" | "articles_completed" | "highlights";
    large?: boolean;
    className?: string;
}) {
    const innerClass = clsx(large ? "h-5" : "h-4", className);

    return (
        <>
            {type === "articles" && (
                <svg className={innerClass} viewBox="0 0 576 512">
                    <path
                        fill="currentColor"
                        d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                    />
                </svg>
            )}
            {type === "articles_completed" && (
                <svg className={innerClass} viewBox="0 0 576 512">
                    <path
                        fill="currentColor"
                        d="M144.3 32.04C106.9 31.29 63.7 41.44 18.6 61.29c-11.42 5.026-18.6 16.67-18.6 29.15l0 357.6c0 11.55 11.99 19.55 22.45 14.65c126.3-59.14 219.8 11 223.8 14.01C249.1 478.9 252.5 480 256 480c12.4 0 16-11.38 16-15.98V80.04c0-5.203-2.531-10.08-6.781-13.08C263.3 65.58 216.7 33.35 144.3 32.04zM557.4 61.29c-45.11-19.79-88.48-29.61-125.7-29.26c-72.44 1.312-118.1 33.55-120.9 34.92C306.5 69.96 304 74.83 304 80.04v383.1C304 468.4 307.5 480 320 480c3.484 0 6.938-1.125 9.781-3.328c3.925-3.018 97.44-73.16 223.8-14c10.46 4.896 22.45-3.105 22.45-14.65l.0001-357.6C575.1 77.97 568.8 66.31 557.4 61.29z"
                    />
                </svg>
            )}
            {type === "highlights" && (
                <svg
                    className={clsx("-mr-0.5", innerClass)}
                    viewBox="0 0 512 512"
                >
                    <path
                        fill="currentColor"
                        d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                    />
                </svg>
            )}
        </>
    );
}

export function ProgressBar({ value, target, color }) {
    return (
        <div className="relative h-4 w-52 overflow-hidden rounded-md">
            <div className="absolute top-0 left-0 h-full w-full bg-white dark:bg-[rgb(19,21,22)]" />
            <div
                className="bg-lindy dark:bg-lindyDark absolute top-0 left-0 h-full transition-all"
                style={{
                    width: `${Math.max((value || 0) / target, 0.05) * 100}%`,
                    background: color,
                }}
            />
        </div>
    );
}
