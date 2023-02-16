import React, { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { latestSettingsVersion, ReplicacheContext, RuntimeReplicache, Settings } from "../../store";
import { ModalStateContext } from "./context";
import { SettingsButton, SettingsGroup } from "../Settings/SettingsGroup";
import { generateCSV } from "../Settings/account";

export default function SettingsModalTab({}: {}) {
    const { darkModeEnabled, userInfo, showSignup, reportEvent } = useContext(ModalStateContext);

    const rep = useContext(ReplicacheContext);
    const [settings, setSettings] = useState<Settings>();
    useEffect(() => {
        if (!rep) {
            return;
        }
        (async () => {
            // fetch previous settings version without subscribe
            const settings = await rep?.query.getSettings();
            setSettings(settings);

            // update version for next visit
            rep.mutate.updateSettings({ seen_settings_version: latestSettingsVersion });
        })();
    }, [rep]);

    const messageRef = useRef<HTMLTextAreaElement>(null);
    // async function submitReport() {
    //     if (!messageRef.current?.value) {
    //         return;
    //     }
    //     const issueUrl = await quickReport(messageRef.current.value, undefined, userInfo?.id);

    //     if (issueUrl) {
    //         window.open(issueUrl, "_blank")?.focus();
    //     }
    //     messageRef.current.value = "";
    //     reportEvent("sendFeedback");
    // }

    return (
        <div className="animate-fadein flex flex-col gap-4">
            <SettingsGroup
                title="Account"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M481.2 33.81c-8.938-3.656-19.31-1.656-26.16 5.219l-50.51 50.51C364.3 53.81 312.1 32 256 32C157 32 68.53 98.31 40.91 193.3C37.19 206 44.5 219.3 57.22 223c12.81 3.781 26.06-3.625 29.75-16.31C108.7 132.1 178.2 80 256 80c43.12 0 83.35 16.42 114.7 43.4l-59.63 59.63c-6.875 6.875-8.906 17.19-5.219 26.16c3.719 8.969 12.47 14.81 22.19 14.81h143.9C485.2 223.1 496 213.3 496 200v-144C496 46.28 490.2 37.53 481.2 33.81zM454.7 288.1c-12.78-3.75-26.06 3.594-29.75 16.31C403.3 379.9 333.8 432 255.1 432c-43.12 0-83.38-16.42-114.7-43.41l59.62-59.62c6.875-6.875 8.891-17.03 5.203-26C202.4 294 193.7 288 183.1 288H40.05c-13.25 0-24.11 10.74-24.11 23.99v144c0 9.719 5.844 18.47 14.81 22.19C33.72 479.4 36.84 480 39.94 480c6.25 0 12.38-2.438 16.97-7.031l50.51-50.52C147.6 458.2 199.9 480 255.1 480c99 0 187.4-66.31 215.1-161.3C474.8 305.1 467.4 292.7 454.7 288.1z"
                        />
                    </svg>
                }
                buttons={
                    <>
                        <SettingsButton
                            title="Export data"
                            onClick={() => generateCSV(rep!)}
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEvent}
                        />
                    </>
                }
            >
                {userInfo?.accountEnabled ? (
                    <p>
                        Hey{userInfo?.email && ` ${userInfo?.email}`}, your articles and highlights
                        are backed-up to your account!
                    </p>
                ) : (
                    <p>Your articles and highlights are saved in your local browser.</p>
                )}
            </SettingsGroup>

            {userInfo?.aiEnabled && (
                <SettingsGroup
                    title="Support"
                    icon={
                        <svg className="h-4 w-4" viewBox="0 0 576 512">
                            <path
                                fill="currentColor"
                                d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                            />
                        </svg>
                    }
                    buttons={
                        <SettingsButton
                            title="Manage subscription"
                            href="https://billing.stripe.com/p/login/5kA8x62Ap9y26v6144"
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEvent}
                        />
                    }
                >
                    <p>
                        The Unclutter library and AI smart reading features are enabled. Thank you
                        for supporting Unclutter!
                    </p>
                </SettingsGroup>
            )}

            <SettingsGroup
                title="Open-source"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
                        />
                    </svg>
                }
                buttons={
                    <>
                        <SettingsButton
                            title="Join Discord"
                            href="https://unclutter.it/discord"
                            darkModeEnabled={darkModeEnabled}
                            primary
                            reportEvent={reportEvent}
                        />
                        <SettingsButton
                            title="Open GitHub"
                            href="https://github.com/lindylearn/unclutter"
                            darkModeEnabled={darkModeEnabled}
                            reportEvent={reportEvent}
                        />
                    </>
                }
            >
                <p>
                    Unclutter is open-source! Join our Discord server or contribute on GitHub to
                    help improve reading on the web for everyone!
                </p>
            </SettingsGroup>

            {/* <SettingsGroup
                title="Give feedback"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M256 32C114.6 32 .0272 125.1 .0272 240c0 47.63 19.91 91.25 52.91 126.2c-14.88 39.5-45.87 72.88-46.37 73.25c-6.625 7-8.375 17.25-4.625 26C5.818 474.2 14.38 480 24 480c61.5 0 109.1-25.75 139.1-46.25C191.1 442.8 223.3 448 256 448c141.4 0 255.1-93.13 255.1-208S397.4 32 256 32zM256.1 400c-26.75 0-53.12-4.125-78.38-12.12l-22.75-7.125l-19.5 13.75c-14.25 10.12-33.88 21.38-57.5 29c7.375-12.12 14.37-25.75 19.88-40.25l10.62-28l-20.62-21.87C69.82 314.1 48.07 282.2 48.07 240c0-88.25 93.25-160 208-160s208 71.75 208 160S370.8 400 256.1 400z"
                        />
                    </svg>
                }
            >
                <textarea
                    className="my-1 h-32 w-full rounded-md p-3 placeholder-neutral-400 outline-none dark:bg-[#212121] dark:placeholder-neutral-500"
                    placeholder="What is broken or could work better?"
                    ref={messageRef}
                />
                <div className="flex gap-3">
                    <SettingsButton
                        title="Send"
                        darkModeEnabled={darkModeEnabled}
                        onClick={submitReport}
                        reportEvent={reportEvent}
                    />
                </div>
            </SettingsGroup> */}
        </div>
    );
}
