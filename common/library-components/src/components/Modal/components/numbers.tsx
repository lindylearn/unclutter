import clsx from "clsx";
import React, { ReactNode, useContext, useEffect, useState } from "react";

export function BigNumber({
    value,
    diff,
    target,
    tag,
    colorOverride,
    icon,
    onClick,
    small = false,
    style,
}: {
    value?: number;
    diff?: number;
    target?: number;
    tag: ReactNode;
    colorOverride?: string;
    icon?: ReactNode;
    onClick?: () => void;
    small?: boolean;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={clsx(
                "big-number relative flex select-none flex-col items-center overflow-hidden rounded-md bg-stone-50 px-3 py-2 transition-all hover:scale-[97%] dark:bg-neutral-800",
                onClick && "cursor-pointer"
            )}
            style={{ background: colorOverride, ...style }}
            onClick={onClick}
        >
            {/* {value !== undefined && target !== undefined && (
                <div
                    className="absolute top-0 left-0 h-full w-full opacity-90"
                    style={{
                        background: colorOverride,
                        width: `${Math.min(1, value / target) * 100}%`,
                    }}
                />
            )} */}
            <div
                className={clsx(
                    "font-title flex items-center gap-2 font-bold transition-opacity",
                    value === undefined && diff === undefined && "opacity-0",
                    small ? "text-xl" : "h-[2rem] text-2xl"
                )}
            >
                {icon}
                <div>
                    {value !== undefined && (
                        <span className={clsx(diff && "")}>{(value || 0) - (diff || 0)}</span>
                    )}

                    {diff !== undefined ? (
                        <>
                            <span className={clsx("mx-1", value === undefined && "-ml-1")}>+</span>
                            <span>{diff}</span>
                        </>
                    ) : (
                        <></>
                    )}
                    {/* {target && <span className="text-base opacity-20"> / {target}</span>} */}

                    {/* {value && diff && <AnimatedNumber value={value} diff={diff} />} */}
                </div>
            </div>
            <div
                className={clsx(
                    "font-text max-w-full overflow-hidden overflow-ellipsis whitespace-nowrap",
                    small ? "text-sm" : ""
                )}
            >
                {tag}
            </div>
        </div>
    );
}

export function ResourceStat({
    value,
    type,
    large = false,
    showPlus = false,
    hideIcon = false,
    className,
}: {
    value?: number;
    type: "articles" | "articles_completed" | "highlights";
    large?: boolean;
    showPlus?: boolean;
    hideIcon?: boolean;
    className?: string;
}) {
    return (
        <div
            className={clsx(
                "relative flex items-center transition-opacity",
                large ? "gap-1.5" : "gap-1.5",
                value === undefined && "opacity-0",
                className
            )}
        >
            {!hideIcon && <ResourceIcon type={type} large={large} />}
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
    // const progress = ((readCount || 0) / (articleCount || 1)) * 100;

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
            {/* <ResourceStat type="articles_completed" value={readCount} large={large} /> */}
            <ResourceStat type="articles" value={articleCount} large={large} />
            {/* <div
                className="bg-lindy dark:bg-lindyDark absolute top-0 left-0 h-full"
                style={{
                    width: `${progress}%`,
                    background: color,
                }}
            /> */}
        </div>
    );
}

export function ResourceIcon({
    type,
    large = false,
    className,
}: {
    type: "articles" | "articles_completed" | "highlights" | "links" | "puzzle";
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
                <svg className={innerClass} viewBox="0 0 448 512">
                    <path
                        fill="currentColor"
                        d="M296 160c-30.93 0-56 25.07-56 56s25.07 56 56 56c2.74 0 5.365-.4258 8-.8066V280c0 13.23-10.77 24-24 24C266.8 304 256 314.8 256 328S266.8 352 280 352C319.7 352 352 319.7 352 280v-64C352 185.1 326.9 160 296 160zM152 160C121.1 160 96 185.1 96 216S121.1 272 152 272C154.7 272 157.4 271.6 160 271.2V280C160 293.2 149.2 304 136 304c-13.25 0-24 10.75-24 24S122.8 352 136 352C175.7 352 208 319.7 208 280v-64C208 185.1 182.9 160 152 160zM384 32H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h320c35.35 0 64-28.65 64-64V96C448 60.65 419.3 32 384 32zM400 416c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16V96c0-8.822 7.178-16 16-16h320c8.822 0 16 7.178 16 16V416z"
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
            {type === "puzzle" && (
                <svg className={innerClass} viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M425 182c-3.027 0-6.031 .1758-9 .5195V170C416 126.4 372.8 96 333.1 96h-4.519c.3457-2.969 .5193-5.973 .5193-9c0-48.79-43.92-87-100-87c-56.07 0-100 38.21-100 87c0 3.027 .1761 6.031 .5218 9h-56.52C33.2 96 0 129.2 0 170v66.21C0 253.8 6.77 269.9 17.85 282C6.77 294.1 0 310.2 0 327.8V438C0 478.8 33.2 512 73.1 512h110.2c17.63 0 33.72-6.77 45.79-17.85C242.1 505.2 258.2 512 275.8 512h58.21C372.8 512 416 481.6 416 438v-56.52c2.969 .3438 5.973 .5195 9 .5195C473.8 382 512 338.1 512 282S473.8 182 425 182zM425 334c-26.35 0-25.77-26-45.21-26C368.9 308 368 316.9 368 327.8V438c0 14.36-19.64 26-34 26h-58.21C264.9 464 256 455.1 256 444.2c0-19.25 25.1-18.88 25.1-45.21c0-21.54-23.28-39-52-39c-28.72 0-52 17.46-52 39c0 26.35 26 25.77 26 45.21C204 455.1 195.1 464 184.2 464H73.1C59.64 464 48 452.4 48 438v-110.2C48 316.9 56.86 308 67.79 308c19.25 0 18.88 26 45.21 26c21.54 0 39-23.28 39-52s-17.46-52-39-52C86.65 230 87.23 256 67.79 256C56.86 256 48 247.1 48 236.2V170C48 155.6 59.64 144 73.1 144h110.2C195.1 144 204 143.1 204 132.2c0-19.25-26-18.88-26-45.21c0-21.54 23.28-39 52-39c28.72 0 52 17.46 52 39C281.1 113.4 256 112.8 256 132.2C256 143.1 264.9 144 275.8 144h58.21C348.4 144 368 155.6 368 170v66.21C368 247.1 368.9 256 379.8 256c19.25 0 18.88-26 45.21-26c21.54 0 39 23.28 39 52S446.5 334 425 334z"
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
