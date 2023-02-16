import React, { useContext, useEffect, useState } from "react";
import clsx from "clsx";
import { ReplicacheContext, Settings, Topic, UserInfo } from "../../store";
import { FilterContext, ModalStateContext } from "./context";
import { getBrowserType, getNewTabVersion } from "../../common";

export default function Sidebar({
    currentTab,
    setCurrentTab,
}: {
    currentTab: string;
    setCurrentTab: (tab: string) => void;
}) {
    const { darkModeEnabled, userInfo, showSignup, isWeb, reportEvent } =
        useContext(ModalStateContext);
    const rep = useContext(ReplicacheContext);

    // fetch settings initially and after changing tab away
    // const [settings, setSettings] = useState<Settings | null>(null);
    // useEffect(() => {
    //     rep?.query.getSettings().then(setSettings);
    // }, [rep]);
    function updateTab(id: string) {
        setCurrentTab(id);

        // rep?.query.getSettings().then(setSettings);
    }

    // const [newTabInstalled, setNewTabInstalled] = useState(true);
    // useEffect(() => {
    //     getNewTabVersion()
    //         .then((version) => setNewTabInstalled(version !== null))
    //         .catch(() => setNewTabInstalled(false));
    // }, []);

    const modalTabs = getModalTabOptions(userInfo, showSignup);

    return (
        <div className="flex h-full items-stretch justify-center gap-1 rounded-lg lg:flex-col lg:justify-between">
            {modalTabs
                .filter((t) => !t.atEnd)
                .map((option) => (
                    <SidebarFilterOption
                        {...option}
                        key={option.value}
                        isActive={currentTab === option.value}
                        onClick={() => updateTab(option.value)}
                        darkModeEnabled={darkModeEnabled}
                    />
                ))}

            <div className="hidden flex-grow lg:block" />

            {modalTabs
                .filter((t) => t.atEnd)
                .map((option) => (
                    <SidebarFilterOption
                        {...option}
                        key={option.value}
                        isActive={currentTab === option.value}
                        onClick={() => {
                            if (option.value === "newtab") {
                                const unclutterLibraryLink =
                                    getBrowserType() === "firefox"
                                        ? "https://addons.mozilla.org/en-GB/firefox/addon/unclutter-library"
                                        : "https://chrome.google.com/webstore/detail/bghgkooimeljolohebojceacblokenjn";

                                window.open(unclutterLibraryLink, "_blank");
                                reportEvent("clickNewTabLink", { source: "modal" });
                            } else if (option.value === "import" && !isWeb) {
                                window.open("https://my.unclutter.it/import", "_blank");
                            } else {
                                updateTab(option.value);
                            }
                        }}
                        darkModeEnabled={darkModeEnabled}
                    />
                ))}
        </div>
    );
}

export interface ModalTabOptions {
    label: string;
    value: string;
    tag?: string | false;
    unavailable?: boolean;
    hiddenOnMobile?: boolean;
    atEnd?: boolean;
    svg: React.ReactNode;
}
function getModalTabOptions(
    userInfo: UserInfo | undefined,
    requireSupport: boolean
): ModalTabOptions[] {
    const options: (ModalTabOptions | false | undefined)[] = [
        {
            label: "Stats",
            value: "stats",
            unavailable: requireSupport && !userInfo?.aiEnabled,
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
            label: "Articles",
            value: "list",
            unavailable: requireSupport && !userInfo?.aiEnabled,
            svg: (
                <svg className="h-4" viewBox="0 0 576 512">
                    <path
                        fill="currentColor"
                        d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                    />
                </svg>
            ),
        },
        // {
        //     label: "Feeds",
        //     value: "feeds",
        //     svg: (
        //         <svg className="w-4" viewBox="0 0 512 512">
        //             <path
        //                 fill="currentColor"
        //                 d="M464 320h-96c-9.094 0-17.41 5.125-21.47 13.28L321.2 384H190.8l-25.38-50.72C161.4 325.1 153.1 320 144 320H32c-17.67 0-32 14.33-32 32v96c0 35.35 28.65 64 64 64h384c35.35 0 64-28.65 64-64v-80C512 341.5 490.5 320 464 320zM464 448c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16v-80h81.16l25.38 50.72C158.6 426.9 166.9 432 176 432h160c9.094 0 17.41-5.125 21.47-13.28L382.8 368H464V448zM238.4 312.3C242.1 317.2 249.3 320 256 320s13.03-2.781 17.59-7.656l104-112c9-9.719 8.438-24.91-1.25-33.94c-9.719-8.969-24.88-8.438-33.94 1.25L280 234.9V24c0-13.25-10.75-24-24-24S232 10.75 232 24v210.9L169.6 167.7C160.5 157.1 145.4 157.4 135.7 166.4C125.1 175.4 125.4 190.6 134.4 200.3L238.4 312.3z"
        //             />
        //         </svg>
        //     ),
        // },
        {
            label: "Quotes",
            value: "highlights",
            unavailable: requireSupport && !userInfo?.aiEnabled,
            svg: (
                // <svg className="h-4" viewBox="0 0 512 512" >
                //     <path
                //         fill="currentColor"
                //         d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                //     />
                // </svg>
                // <svg className="w-4" viewBox="0 0 448 512">
                //     <path
                //         fill="currentColor"
                //         d="M96 416c53.02 0 96-42.98 96-96S149 224 96 224C78.42 224 62.17 229.1 48 237.3V216c0-39.7 32.31-72 72-72h16C149.3 144 160 133.3 160 120S149.3 96 136 96h-16C53.84 96 0 149.8 0 216V320C0 373 42.98 416 96 416zM96 272c26.47 0 48 21.53 48 48S122.5 368 96 368S48 346.5 48 320S69.53 272 96 272zM352 416c53.02 0 96-42.98 96-96s-42.98-96-96-96c-17.58 0-33.83 5.068-48 13.31V216c0-39.7 32.31-72 72-72h16C405.3 144 416 133.3 416 120S405.3 96 392 96h-16C309.8 96 256 149.8 256 216V320C256 373 298.1 416 352 416zM352 272c26.47 0 48 21.53 48 48s-21.53 48-48 48s-48-21.53-48-48S325.5 272 352 272z"
                //     />
                // </svg>
                <svg className="w-4" viewBox="0 0 448 512">
                    <path
                        fill="currentColor"
                        d="M296 160c-30.93 0-56 25.07-56 56s25.07 56 56 56c2.74 0 5.365-.4258 8-.8066V280c0 13.23-10.77 24-24 24C266.8 304 256 314.8 256 328S266.8 352 280 352C319.7 352 352 319.7 352 280v-64C352 185.1 326.9 160 296 160zM152 160C121.1 160 96 185.1 96 216S121.1 272 152 272C154.7 272 157.4 271.6 160 271.2V280C160 293.2 149.2 304 136 304c-13.25 0-24 10.75-24 24S122.8 352 136 352C175.7 352 208 319.7 208 280v-64C208 185.1 182.9 160 152 160zM384 32H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h320c35.35 0 64-28.65 64-64V96C448 60.65 419.3 32 384 32zM400 416c0 8.822-7.178 16-16 16H64c-8.822 0-16-7.178-16-16V96c0-8.822 7.178-16 16-16h320c8.822 0 16 7.178 16 16V416z"
                    />
                </svg>
            ),
        },

        requireSupport && {
            label: "About",
            value: "about",
            atEnd: true,
            hiddenOnMobile: true,
            svg: (
                <svg className="h-4 w-4" viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM296 336h-16V248C280 234.8 269.3 224 256 224H224C210.8 224 200 234.8 200 248S210.8 272 224 272h8v64h-16C202.8 336 192 346.8 192 360S202.8 384 216 384h80c13.25 0 24-10.75 24-24S309.3 336 296 336zM256 192c17.67 0 32-14.33 32-32c0-17.67-14.33-32-32-32S224 142.3 224 160C224 177.7 238.3 192 256 192z"
                    />
                </svg>
            ),
        },
        requireSupport && {
            label: "Import",
            value: "import",
            atEnd: true,
            hiddenOnMobile: true,
            unavailable: requireSupport && !userInfo?.aiEnabled,
            svg: (
                <svg className="h-4 w-4" viewBox="0 0 512 512">
                    <path
                        fill="currentColor"
                        d="M481.2 33.81c-8.938-3.656-19.31-1.656-26.16 5.219l-50.51 50.51C364.3 53.81 312.1 32 256 32C157 32 68.53 98.31 40.91 193.3C37.19 206 44.5 219.3 57.22 223c12.81 3.781 26.06-3.625 29.75-16.31C108.7 132.1 178.2 80 256 80c43.12 0 83.35 16.42 114.7 43.4l-59.63 59.63c-6.875 6.875-8.906 17.19-5.219 26.16c3.719 8.969 12.47 14.81 22.19 14.81h143.9C485.2 223.1 496 213.3 496 200v-144C496 46.28 490.2 37.53 481.2 33.81zM454.7 288.1c-12.78-3.75-26.06 3.594-29.75 16.31C403.3 379.9 333.8 432 255.1 432c-43.12 0-83.38-16.42-114.7-43.41l59.62-59.62c6.875-6.875 8.891-17.03 5.203-26C202.4 294 193.7 288 183.1 288H40.05c-13.25 0-24.11 10.74-24.11 23.99v144c0 9.719 5.844 18.47 14.81 22.19C33.72 479.4 36.84 480 39.94 480c6.25 0 12.38-2.438 16.97-7.031l50.51-50.52C147.6 458.2 199.9 480 255.1 480c99 0 187.4-66.31 215.1-161.3C474.8 305.1 467.4 292.7 454.7 288.1z"
                    />
                </svg>
            ),
        },
        {
            label: "Settings",
            value: "settings",
            atEnd: true,
            hiddenOnMobile: true,
            svg: (
                <svg viewBox="0 0 512 512" className="h-4">
                    <path
                        fill="currentColor"
                        d="M160 256C160 202.1 202.1 160 256 160C309 160 352 202.1 352 256C352 309 309 352 256 352C202.1 352 160 309 160 256zM256 208C229.5 208 208 229.5 208 256C208 282.5 229.5 304 256 304C282.5 304 304 282.5 304 256C304 229.5 282.5 208 256 208zM293.1 .0003C315.3 .0003 334.6 15.19 339.8 36.74L347.6 69.21C356.1 73.36 364.2 78.07 371.9 83.28L404 73.83C425.3 67.56 448.1 76.67 459.2 95.87L496.3 160.1C507.3 179.3 503.8 203.6 487.8 218.9L463.5 241.1C463.8 246.6 464 251.3 464 256C464 260.7 463.8 265.4 463.5 270L487.8 293.1C503.8 308.4 507.3 332.7 496.3 351.9L459.2 416.1C448.1 435.3 425.3 444.4 404 438.2L371.9 428.7C364.2 433.9 356.1 438.6 347.6 442.8L339.8 475.3C334.6 496.8 315.3 512 293.1 512H218.9C196.7 512 177.4 496.8 172.2 475.3L164.4 442.8C155.9 438.6 147.8 433.9 140.1 428.7L107.1 438.2C86.73 444.4 63.94 435.3 52.85 416.1L15.75 351.9C4.66 332.7 8.168 308.4 24.23 293.1L48.47 270C48.16 265.4 48 260.7 48 255.1C48 251.3 48.16 246.6 48.47 241.1L24.23 218.9C8.167 203.6 4.66 179.3 15.75 160.1L52.85 95.87C63.94 76.67 86.73 67.56 107.1 73.83L140.1 83.28C147.8 78.07 155.9 73.36 164.4 69.21L172.2 36.74C177.4 15.18 196.7 0 218.9 0L293.1 .0003zM205.5 103.6L194.3 108.3C181.6 113.6 169.8 120.5 159.1 128.7L149.4 136.1L94.42 119.9L57.31 184.1L98.81 223.6L97.28 235.6C96.44 242.3 96 249.1 96 256C96 262.9 96.44 269.7 97.28 276.4L98.81 288.4L57.32 327.9L94.42 392.1L149.4 375.9L159.1 383.3C169.8 391.5 181.6 398.4 194.3 403.7L205.5 408.4L218.9 464H293.1L306.5 408.4L317.7 403.7C330.4 398.4 342.2 391.5 352.9 383.3L362.6 375.9L417.6 392.1L454.7 327.9L413.2 288.4L414.7 276.4C415.6 269.7 416 262.9 416 256C416 249.1 415.6 242.3 414.7 235.6L413.2 223.6L454.7 184.1L417.6 119.9L362.6 136.1L352.9 128.7C342.2 120.5 330.4 113.6 317.7 108.3L306.5 103.6L293.1 48H218.9L205.5 103.6z"
                    />
                </svg>
            ),
        },
    ];

    // @ts-ignore
    return options.filter((x) => x);
}

function SidebarFilterOption({
    isActive,
    label,
    tag,
    unavailable,
    hiddenOnMobile,
    svg,
    onClick = () => {},
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
                "relative select-none items-center gap-2 rounded-md px-2 py-1 font-medium outline-none transition-all hover:scale-[97%]",
                isActive
                    ? "bg-stone-100 dark:bg-neutral-800"
                    : "hover:bg-stone-100 dark:text-neutral-500 hover:dark:bg-neutral-800",
                unavailable && (isActive ? "bg-stone-100" : "opacity-50"),
                unavailable ? "" : "cursor-pointer",
                hiddenOnMobile ? "hidden lg:flex" : "flex"
            )}
            onClick={unavailable ? undefined : onClick}
        >
            <div className="flex w-5 justify-center">{svg}</div>
            <div className="relative">
                {label}
                {tag && (
                    <div className="bg-lindy dark:bg-lindyDark absolute -top-1 left-[calc(100%+0.25rem)] z-20 w-max rounded-md px-1 text-sm leading-tight dark:text-[rgb(232,230,227)]">
                        {tag}
                    </div>
                )}
            </div>
        </div>
    );
}
