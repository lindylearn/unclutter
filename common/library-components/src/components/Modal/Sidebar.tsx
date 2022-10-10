import React from "react";
import clsx from "clsx";
import { LindyIcon } from "../Icons";
import { Topic } from "../../store";
import { getRandomLightColor } from "../../common";
import { UserInfo } from "../../store/user";

export default function Sidebar({
    userInfo,
    currentTab,
    currentTopic,
    changedTopic,
    setCurrentTab,
    relatedLinkCount,
    darkModeEnabled,
}: {
    userInfo: UserInfo;
    currentTab: string;
    currentTopic?: Topic;
    changedTopic: boolean;
    setCurrentTab: (tab: string) => void;
    relatedLinkCount?: number;
    darkModeEnabled: boolean;
}) {
    const modalTabs = getModalTabOptions(
        userInfo,
        !changedTopic ? relatedLinkCount : undefined
    );

    return (
        <div className="flex h-full flex-col items-stretch justify-between gap-1 rounded-lg">
            {modalTabs
                .filter((t) => !t.atEnd)
                .map((option) => (
                    <SidebarFilterOption
                        {...option}
                        key={option.value}
                        isActive={currentTab === option.value}
                        onClick={() => setCurrentTab(option.value)}
                        currentTopic={currentTopic}
                        darkModeEnabled={darkModeEnabled}
                    />
                ))}

            <div className="h-2" />
            {/* {tabInfos?.slice(1).map((tabInfo) => (
                <SidebarFilterOption
                    key={tabInfo.key}
                    label={tabInfo.title}
                    svg={tabInfo.icon}
                    color={getRandomColor(tabInfo.key).replace(
                        "0.4)",
                        false ? "0.3)" : "0.15)"
                    )}
                />
            ))} */}

            <div className="flex-grow" />
            {modalTabs
                .filter((t) => t.atEnd)
                .map((option) => (
                    <SidebarFilterOption
                        {...option}
                        key={option.value}
                        isActive={currentTab === option.value}
                        onClick={() => setCurrentTab(option.value)}
                        currentTopic={currentTopic}
                        darkModeEnabled={darkModeEnabled}
                    />
                ))}
        </div>
    );
}

export interface ModalTabOptions {
    label: string;
    value: string;
    tag?: string;
    unavailable?: boolean;
    atEnd?: boolean;
    svg: React.ReactNode;
}
function getModalTabOptions(
    userInfo: UserInfo,
    new_link_count?: number
): ModalTabOptions[] {
    return [
        {
            label: "Related",
            value: "graph",
            tag: new_link_count ? `${new_link_count} +` : undefined,
            unavailable: !userInfo.topicsEnabled,
            svg: (
                <svg className="h-4" viewBox="0 0 640 512">
                    <path
                        fill="currentColor"
                        d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
                    />
                </svg>
            ),
        },
        {
            label: "Progress",
            value: "stats",
            svg: (
                <svg className="h-4" viewBox="0 0 448 512">
                    <path
                        fill="currentColor"
                        d="M240 32C266.5 32 288 53.49 288 80V432C288 458.5 266.5 480 240 480H208C181.5 480 160 458.5 160 432V80C160 53.49 181.5 32 208 32H240zM240 80H208V432H240V80zM80 224C106.5 224 128 245.5 128 272V432C128 458.5 106.5 480 80 480H48C21.49 480 0 458.5 0 432V272C0 245.5 21.49 224 48 224H80zM80 272H48V432H80V272zM320 144C320 117.5 341.5 96 368 96H400C426.5 96 448 117.5 448 144V432C448 458.5 426.5 480 400 480H368C341.5 480 320 458.5 320 432V144zM368 432H400V144H368V432z"
                    />
                </svg>
            ),
        },
        {
            label: "Read later",
            value: "recent",
            svg: (
                <svg className="h-4" viewBox="0 0 640 512">
                    <path
                        fill="currentColor"
                        d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
                    />
                </svg>
            ),
        },
        // {
        //     label: "Topics",
        //     value: "topics",
        //     svg: (
        //         <svg viewBox="0 0 512 512" className="h-4">
        //             <path
        //                 fill="currentColor"
        //                 d="M160 384l127.1 .0001V128L160 128V384zM96 .0028H31.1C14.37 .0028 0 14.38 0 32v63.1l128-.0008l.0008-63.1C128 14.38 113.6 .0028 96 .0028zM160 479.1c0 17.62 14.37 31.1 32 31.1h63.1c17.62 0 31.98-14.36 31.1-31.98l0-64.02h-127.1L160 479.1zM0 479.1c0 17.62 14.37 31.1 31.1 31.1h64c17.62 0 31.1-14.37 31.1-31.1L128 416H0V479.1zM0 384l128-.0001V128L0 128V384zM419.9 116.2l-123.6 33.04l66.21 246.7l123.7-33.04L419.9 116.2zM510.9 455.3l-16.48-61.67l-123.6 33.05l16.55 61.66c4.559 16.98 22.15 27.12 39.17 22.57l61.85-16.52C505.4 489.8 515.5 472.3 510.9 455.3zM395 23.64c-4.568-16.98-22.15-27.1-39.16-22.55l-61.78 16.52c-3.072 .8203-5.619 2.484-8.197 4.07c-4.348-12.52-15.93-21.68-29.9-21.68h-63.1c-17.63 0-32 14.37-32 31.1L160 96l122 .0014l6.004 22.37l123.5-33.05L395 23.64z"
        //             />
        //         </svg>
        //     ),
        // },
        {
            label: "Highlights",
            value: "highlights",
            svg: (
                <svg viewBox="0 0 512 512" className="h-4">
                    <path
                        fill="currentColor"
                        d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                    />
                </svg>
            ),
        },
        // {
        //     label: "Sync",
        //     value: "sync",
        //     atEnd: true,
        //     svg: (
        //         <svg viewBox="0 0 512 512" className="h-4">
        //             <path
        //                 fill="currentColor"
        //                 d="M481.2 33.81c-8.938-3.656-19.31-1.656-26.16 5.219l-50.51 50.51C364.3 53.81 312.1 32 256 32C157 32 68.53 98.31 40.91 193.3C37.19 206 44.5 219.3 57.22 223c12.81 3.781 26.06-3.625 29.75-16.31C108.7 132.1 178.2 80 256 80c43.12 0 83.35 16.42 114.7 43.4l-59.63 59.63c-6.875 6.875-8.906 17.19-5.219 26.16c3.719 8.969 12.47 14.81 22.19 14.81h143.9C485.2 223.1 496 213.3 496 200v-144C496 46.28 490.2 37.53 481.2 33.81zM454.7 288.1c-12.78-3.75-26.06 3.594-29.75 16.31C403.3 379.9 333.8 432 255.1 432c-43.12 0-83.38-16.42-114.7-43.41l59.62-59.62c6.875-6.875 8.891-17.03 5.203-26C202.4 294 193.7 288 183.1 288H40.05c-13.25 0-24.11 10.74-24.11 23.99v144c0 9.719 5.844 18.47 14.81 22.19C33.72 479.4 36.84 480 39.94 480c6.25 0 12.38-2.438 16.97-7.031l50.51-50.52C147.6 458.2 199.9 480 255.1 480c99 0 187.4-66.31 215.1-161.3C474.8 305.1 467.4 292.7 454.7 288.1z"
        //             />
        //         </svg>
        //     ),
        // },
        // {
        //     label: "Settings",
        //     value: "settings",
        //     atEnd: true,
        //     svg: (
        //         <svg viewBox="0 0 512 512" className="h-4">
        //             <path
        //                 fill="currentColor"
        //                 d="M160 256C160 202.1 202.1 160 256 160C309 160 352 202.1 352 256C352 309 309 352 256 352C202.1 352 160 309 160 256zM256 208C229.5 208 208 229.5 208 256C208 282.5 229.5 304 256 304C282.5 304 304 282.5 304 256C304 229.5 282.5 208 256 208zM293.1 .0003C315.3 .0003 334.6 15.19 339.8 36.74L347.6 69.21C356.1 73.36 364.2 78.07 371.9 83.28L404 73.83C425.3 67.56 448.1 76.67 459.2 95.87L496.3 160.1C507.3 179.3 503.8 203.6 487.8 218.9L463.5 241.1C463.8 246.6 464 251.3 464 256C464 260.7 463.8 265.4 463.5 270L487.8 293.1C503.8 308.4 507.3 332.7 496.3 351.9L459.2 416.1C448.1 435.3 425.3 444.4 404 438.2L371.9 428.7C364.2 433.9 356.1 438.6 347.6 442.8L339.8 475.3C334.6 496.8 315.3 512 293.1 512H218.9C196.7 512 177.4 496.8 172.2 475.3L164.4 442.8C155.9 438.6 147.8 433.9 140.1 428.7L107.1 438.2C86.73 444.4 63.94 435.3 52.85 416.1L15.75 351.9C4.66 332.7 8.168 308.4 24.23 293.1L48.47 270C48.16 265.4 48 260.7 48 255.1C48 251.3 48.16 246.6 48.47 241.1L24.23 218.9C8.167 203.6 4.66 179.3 15.75 160.1L52.85 95.87C63.94 76.67 86.73 67.56 107.1 73.83L140.1 83.28C147.8 78.07 155.9 73.36 164.4 69.21L172.2 36.74C177.4 15.18 196.7 0 218.9 0L293.1 .0003zM205.5 103.6L194.3 108.3C181.6 113.6 169.8 120.5 159.1 128.7L149.4 136.1L94.42 119.9L57.31 184.1L98.81 223.6L97.28 235.6C96.44 242.3 96 249.1 96 256C96 262.9 96.44 269.7 97.28 276.4L98.81 288.4L57.32 327.9L94.42 392.1L149.4 375.9L159.1 383.3C169.8 391.5 181.6 398.4 194.3 403.7L205.5 408.4L218.9 464H293.1L306.5 408.4L317.7 403.7C330.4 398.4 342.2 391.5 352.9 383.3L362.6 375.9L417.6 392.1L454.7 327.9L413.2 288.4L414.7 276.4C415.6 269.7 416 262.9 416 256C416 249.1 415.6 242.3 414.7 235.6L413.2 223.6L454.7 184.1L417.6 119.9L362.6 136.1L352.9 128.7C342.2 120.5 330.4 113.6 317.7 108.3L306.5 103.6L293.1 48H218.9L205.5 103.6z"
        //             />
        //         </svg>
        //     ),
        // },
    ];
}

function SidebarFilterOption({
    isActive,
    label,
    tag,
    unavailable,
    svg,
    onClick = () => {},
    currentTopic,
    darkModeEnabled,
}: ModalTabOptions & {
    isActive: boolean;
    onClick: () => void;
    currentTopic?: Topic;
    darkModeEnabled: boolean;
}) {
    return (
        <div
            className={clsx(
                "relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 font-medium outline-none transition-all hover:scale-[97%]",
                isActive
                    ? "bg-stone-50 dark:bg-neutral-800"
                    : "hover:bg-stone-50 dark:text-neutral-500 hover:dark:bg-neutral-800",
                unavailable && "opacity-30"
            )}
            onClick={onClick}
        >
            <div className="flex w-5 justify-center">{svg}</div>
            {label}
            {!tag && (
                <div
                    className="bg-lindy dark:bg-lindyDark absolute -top-1 right-1 z-20 rounded-md px-1 text-sm leading-tight dark:text-[rgb(232,230,227)]"
                    style={{
                        background:
                            currentTopic &&
                            getRandomLightColor(
                                currentTopic.id,
                                darkModeEnabled
                            ),
                    }}
                >
                    {tag}
                </div>
            )}
        </div>
    );
}
