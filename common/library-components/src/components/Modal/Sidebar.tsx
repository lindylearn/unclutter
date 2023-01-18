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
    const { darkModeEnabled, userInfo, showSignup, reportEvent } = useContext(ModalStateContext);
    const { currentTopic, changedTopic, currentAnnotationsCount, relatedLinkCount } =
        useContext(FilterContext);
    const rep = useContext(ReplicacheContext);

    // fetch settings initially and after changing tab away
    const [settings, setSettings] = useState<Settings | null>(null);
    useEffect(() => {
        rep?.query.getSettings().then(setSettings);
    }, [rep]);
    function updateTab(id: string) {
        setCurrentTab(id);

        rep?.query.getSettings().then(setSettings);
    }

    const [newTabInstalled, setNewTabInstalled] = useState(true);
    useEffect(() => {
        getNewTabVersion()
            .then((version) => setNewTabInstalled(version !== null))
            .catch(() => setNewTabInstalled(false));
    }, []);

    const modalTabs = getModalTabOptions(
        userInfo,
        settings,
        showSignup,
        newTabInstalled,
        !changedTopic ? relatedLinkCount : undefined,
        currentAnnotationsCount
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
                        onClick={() => updateTab(option.value)}
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
                        onClick={() => {
                            if (option.value === "newtab") {
                                const unclutterLibraryLink =
                                    getBrowserType() === "firefox"
                                        ? "https://addons.mozilla.org/en-GB/firefox/addon/unclutter-library"
                                        : "https://chrome.google.com/webstore/detail/bghgkooimeljolohebojceacblokenjn";

                                window.open(unclutterLibraryLink, "_blank");
                                reportEvent("clickNewTabLink", { source: "modal" });
                            } else {
                                updateTab(option.value);
                            }
                        }}
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
    tag?: string | false;
    unavailable?: boolean;
    atEnd?: boolean;
    svg: React.ReactNode;
}
function getModalTabOptions(
    userInfo: UserInfo | undefined,
    settings: Settings | null,
    showSignup: boolean,
    newTabInstalled: boolean,
    new_link_count?: number,
    currentAnnotationsCount?: number
): ModalTabOptions[] {
    const options: (ModalTabOptions | false | undefined)[] = [
        {
            label: "Stats",
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
            label: "Articles",
            value: "list",
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
            label: "Highlights",
            value: "highlights",
            // tag: (settings?.seen_highlights_version || 0) < latestHighlightsVersion && "New",
            // need to update count or track visited to show highlights count after delete
            // || (currentAnnotationsCount ? `${currentAnnotationsCount}` : undefined),
            svg: (
                <svg viewBox="0 0 512 512" className="h-4">
                    <path
                        fill="currentColor"
                        d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                    />
                </svg>
            ),
        },
        // showSignup &&
        //     !(userInfo?.aiEnabled && {
        //         label: "More",
        //         value: "signup",
        //         unavailable: true,
        //         svg: (
        //             <svg className="h-4" viewBox="0 0 640 512">
        //                 <path
        //                     fill="currentColor"
        //                     d="M288 64C288 80.85 281.5 96.18 270.8 107.6L297.7 165.2C309.9 161.8 322.7 160 336 160C374.1 160 410.4 175.5 436.3 200.7L513.9 143.7C512.7 138.7 512 133.4 512 128C512 92.65 540.7 64 576 64C611.3 64 640 92.65 640 128C640 163.3 611.3 192 576 192C563.7 192 552.1 188.5 542.3 182.4L464.7 239.4C474.5 258.8 480 280.8 480 304C480 322.5 476.5 340.2 470.1 356.5L537.5 396.9C548.2 388.8 561.5 384 576 384C611.3 384 640 412.7 640 448C640 483.3 611.3 512 576 512C540.7 512 512 483.3 512 448C512 444.6 512.3 441.3 512.8 438.1L445.4 397.6C418.1 428.5 379.8 448 336 448C264.6 448 205.4 396.1 193.1 328H123.3C113.9 351.5 90.86 368 64 368C28.65 368 0 339.3 0 304C0 268.7 28.65 240 64 240C90.86 240 113.9 256.5 123.3 280H193.1C200.6 240.9 222.9 207.1 254.2 185.5L227.3 127.9C226.2 127.1 225.1 128 224 128C188.7 128 160 99.35 160 64C160 28.65 188.7 0 224 0C259.3 0 288 28.65 288 64V64zM336 400C389 400 432 357 432 304C432 250.1 389 208 336 208C282.1 208 240 250.1 240 304C240 357 282.1 400 336 400z"
        //                 />
        //             </svg>
        //         ),
        //     },

        userInfo?.aiEnabled && {
            label: "Sync",
            value: "sync",
            atEnd: true,
            unavailable: false,
            svg: (
                <svg viewBox="0 0 512 512" className="h-4">
                    <path
                        fill="currentColor"
                        d="M481.2 33.81c-8.938-3.656-19.31-1.656-26.16 5.219l-50.51 50.51C364.3 53.81 312.1 32 256 32C157 32 68.53 98.31 40.91 193.3C37.19 206 44.5 219.3 57.22 223c12.81 3.781 26.06-3.625 29.75-16.31C108.7 132.1 178.2 80 256 80c43.12 0 83.35 16.42 114.7 43.4l-59.63 59.63c-6.875 6.875-8.906 17.19-5.219 26.16c3.719 8.969 12.47 14.81 22.19 14.81h143.9C485.2 223.1 496 213.3 496 200v-144C496 46.28 490.2 37.53 481.2 33.81zM454.7 288.1c-12.78-3.75-26.06 3.594-29.75 16.31C403.3 379.9 333.8 432 255.1 432c-43.12 0-83.38-16.42-114.7-43.41l59.62-59.62c6.875-6.875 8.891-17.03 5.203-26C202.4 294 193.7 288 183.1 288H40.05c-13.25 0-24.11 10.74-24.11 23.99v144c0 9.719 5.844 18.47 14.81 22.19C33.72 479.4 36.84 480 39.94 480c6.25 0 12.38-2.438 16.97-7.031l50.51-50.52C147.6 458.2 199.9 480 255.1 480c99 0 187.4-66.31 215.1-161.3C474.8 305.1 467.4 292.7 454.7 288.1z"
                    />
                </svg>
            ),
        },

        // !newTabInstalled && {
        //     label: "New Tab",
        //     value: "newtab",
        //     atEnd: true,
        //     svg:
        //         getBrowserType() === "firefox" ? (
        //             <svg className="h-4" viewBox="0 0 512 512">
        //                 <path
        //                     fill="currentColor"
        //                     d="M503.52,241.48c-.12-1.56-.24-3.12-.24-4.68v-.12l-.36-4.68v-.12a245.86,245.86,0,0,0-7.32-41.15c0-.12,0-.12-.12-.24l-1.08-4c-.12-.24-.12-.48-.24-.6-.36-1.2-.72-2.52-1.08-3.72-.12-.24-.12-.6-.24-.84-.36-1.2-.72-2.4-1.08-3.48-.12-.36-.24-.6-.36-1-.36-1.2-.72-2.28-1.2-3.48l-.36-1.08c-.36-1.08-.84-2.28-1.2-3.36a8.27,8.27,0,0,0-.36-1c-.48-1.08-.84-2.28-1.32-3.36-.12-.24-.24-.6-.36-.84-.48-1.2-1-2.28-1.44-3.48,0-.12-.12-.24-.12-.36-1.56-3.84-3.24-7.68-5-11.4l-.36-.72c-.48-1-.84-1.8-1.32-2.64-.24-.48-.48-1.08-.72-1.56-.36-.84-.84-1.56-1.2-2.4-.36-.6-.6-1.2-1-1.8s-.84-1.44-1.2-2.28c-.36-.6-.72-1.32-1.08-1.92s-.84-1.44-1.2-2.16a18.07,18.07,0,0,0-1.2-2c-.36-.72-.84-1.32-1.2-2s-.84-1.32-1.2-2-.84-1.32-1.2-1.92-.84-1.44-1.32-2.16a15.63,15.63,0,0,0-1.2-1.8L463.2,119a15.63,15.63,0,0,0-1.2-1.8c-.48-.72-1.08-1.56-1.56-2.28-.36-.48-.72-1.08-1.08-1.56l-1.8-2.52c-.36-.48-.6-.84-1-1.32-1-1.32-1.8-2.52-2.76-3.72a248.76,248.76,0,0,0-23.51-26.64A186.82,186.82,0,0,0,412,62.46c-4-3.48-8.16-6.72-12.48-9.84a162.49,162.49,0,0,0-24.6-15.12c-2.4-1.32-4.8-2.52-7.2-3.72a254,254,0,0,0-55.43-19.56c-1.92-.36-3.84-.84-5.64-1.2h-.12c-1-.12-1.8-.36-2.76-.48a236.35,236.35,0,0,0-38-4H255.14a234.62,234.62,0,0,0-45.48,5c-33.59,7.08-63.23,21.24-82.91,39-1.08,1-1.92,1.68-2.4,2.16l-.48.48H124l-.12.12.12-.12a.12.12,0,0,0,.12-.12l-.12.12a.42.42,0,0,1,.24-.12c14.64-8.76,34.92-16,49.44-19.56l5.88-1.44c.36-.12.84-.12,1.2-.24,1.68-.36,3.36-.72,5.16-1.08.24,0,.6-.12.84-.12C250.94,20.94,319.34,40.14,367,85.61a171.49,171.49,0,0,1,26.88,32.76c30.36,49.2,27.48,111.11,3.84,147.59-34.44,53-111.35,71.27-159,24.84a84.19,84.19,0,0,1-25.56-59,74.05,74.05,0,0,1,6.24-31c1.68-3.84,13.08-25.67,18.24-24.59-13.08-2.76-37.55,2.64-54.71,28.19-15.36,22.92-14.52,58.2-5,83.28a132.85,132.85,0,0,1-12.12-39.24c-12.24-82.55,43.31-153,94.31-170.51-27.48-24-96.47-22.31-147.71,15.36-29.88,22-51.23,53.16-62.51,90.36,1.68-20.88,9.6-52.08,25.8-83.88-17.16,8.88-39,37-49.8,62.88-15.6,37.43-21,82.19-16.08,124.79.36,3.24.72,6.36,1.08,9.6,19.92,117.11,122,206.38,244.78,206.38C392.77,503.42,504,392.19,504,255,503.88,250.48,503.76,245.92,503.52,241.48Z"
        //                 />
        //             </svg>
        //         ) : (
        //             <svg className="h-4" viewBox="0 0 496 512">
        //                 <path
        //                     fill="currentColor"
        //                     d="M131.5 217.5L55.1 100.1c47.6-59.2 119-91.8 192-92.1 42.3-.3 85.5 10.5 124.8 33.2 43.4 25.2 76.4 61.4 97.4 103L264 133.4c-58.1-3.4-113.4 29.3-132.5 84.1zm32.9 38.5c0 46.2 37.4 83.6 83.6 83.6s83.6-37.4 83.6-83.6-37.4-83.6-83.6-83.6-83.6 37.3-83.6 83.6zm314.9-89.2L339.6 174c37.9 44.3 38.5 108.2 6.6 157.2L234.1 503.6c46.5 2.5 94.4-7.7 137.8-32.9 107.4-62 150.9-192 107.4-303.9zM133.7 303.6L40.4 120.1C14.9 159.1 0 205.9 0 256c0 124 90.8 226.7 209.5 244.9l63.7-124.8c-57.6 10.8-113.2-20.8-139.5-72.5z"
        //                 />
        //             </svg>
        //         ),
        // },

        // {
        //     label: "Feedback",
        //     value: "feedback",
        //     atEnd: true,
        //     svg: (
        //         <svg className="h-4 w-4" viewBox="0 0 512 512">
        //             <path
        //                 fill="currentColor"
        //                 d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
        //             />
        //         </svg>
        //     ),
        // },

        {
            label: "Settings",
            value: "settings",
            // tag: (settings?.seen_settings_version || 0) < latestSettingsVersion && "New",
            atEnd: true,
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
                "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1 font-medium outline-none transition-all hover:scale-[97%]",
                isActive
                    ? "bg-stone-100 dark:bg-neutral-800"
                    : "hover:bg-stone-100 dark:text-neutral-500 hover:dark:bg-neutral-800",
                unavailable && (isActive ? "bg-stone-100" : "opacity-50")
            )}
            onClick={onClick}
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
