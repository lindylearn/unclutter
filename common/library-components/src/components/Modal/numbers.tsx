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
                    "font-title z-10 flex h-[2rem] items-center gap-2 text-2xl font-bold transition-opacity",
                    value === undefined && "opacity-0"
                )}
            >
                {icon}
                <div>
                    {value}
                    {target && <span className="text-base opacity-20"> / {target}</span>}
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
                "relative z-10 flex items-center transition-opacity",
                large ? "gap-1.5" : "gap-1",
                value === undefined && "opacity-0",
                className
            )}
        >
            <ResourceIcon type={type} large={large} />
            <div className={clsx("font-title select-none font-bold", large ? "text-xl" : "")}>
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
    hideIfZero = true,
    color,
    className,
    onClick = () => {},
}: {
    articleCount?: number;
    readCount?: number;
    unreadCount?: number;
    large?: boolean;
    hideIfZero?: boolean;
    color?: string;
    className?: string;
    onClick?: () => void;
}) {
    // const unreadCount = (articleCount || 0) - (readCount || 0);
    const progress = ((readCount || 0) / (articleCount || 1)) * 100;

    return (
        <div
            className={clsx(
                "flex overflow-hidden rounded-md transition-all",
                hideIfZero && !articleCount && "opacity-0",
                large ? "gap-3" : "gap-2", // padding set via className
                className
            )}
            onClick={onClick}
        >
            <ResourceStat type="articles_completed" value={readCount} large={large} />
            <ResourceStat
                type="articles"
                value={
                    articleCount !== undefined && readCount !== undefined
                        ? articleCount - readCount
                        : undefined
                }
                large={large}
            />
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
    type: "articles" | "articles_completed" | "highlights" | "links";
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
                <svg className={innerClass} viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"
                    />
                </svg>
            )}
            {type === "highlights" && (
                <svg className={clsx("-mr-0.5", innerClass)} viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                    />
                </svg>
            )}
            {type === "links" && (
                <svg className={innerClass} viewBox="0 0 640 512">
                    <path
                        fill="currentColor"
                        d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                    />
                </svg>
            )}
        </>
    );
}

export function AnimatedNumber({ value, diff }: { value: number; diff: number }) {
    return (
        <div className="animated-number relative">
            <div className="after-value">{value}</div>
            <div className="before-value absolute top-0 left-0 h-full w-full">{value - diff}</div>
        </div>
    );
}
