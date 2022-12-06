import clsx from "clsx";
import React, { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { quickReport } from "../../common";
import { latestSettingsVersion, ReplicacheContext, Settings, UserInfo } from "../../store";
import { getActivityColor } from "../Charts";
import { saveAs } from "file-saver";

export default function SettingsModalTab({
    userInfo,
    darkModeEnabled,
    showSignup,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    darkModeEnabled: boolean;
    showSignup: boolean;
    reportEvent?: (event: string, data?: any) => void;
}) {
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
    async function submitReport() {
        if (!messageRef.current?.value) {
            return;
        }
        const issueUrl = await quickReport(messageRef.current.value, undefined, userInfo.id);

        if (issueUrl) {
            window.open(issueUrl, "_blank")?.focus();
        }
        messageRef.current.value = "";
        reportEvent("sendFeedback");
    }

    async function generateCSV() {
        const articles = await rep?.query.listArticles();
        const annotations = await rep?.query.listAnnotations();
        if (!articles || !annotations) {
            return;
        }

        const header = Object.keys(articles[0]).join(",");
        const rows = articles.map((article) =>
            Object.values(article)
                .map((value) => (value?.toString().includes(",") ? `"${value}"` : value))
                .join(",")
        );
        const bytes = new TextEncoder().encode([header].concat(rows).join("\r\n") + "\r\n");
        const blob = new Blob([bytes], {
            type: "data:text/csv;charset=utf-8",
        });
        saveAs(blob, "articles.csv");

        const header2 = Object.keys(annotations[0]).join(",");
        const rows2 = annotations.map((article) =>
            Object.values(article)
                .map((value) => (value?.toString().includes(",") ? `"${value}"` : value))
                .join(",")
        );
        const bytes2 = new TextEncoder().encode([header2].concat(rows2).join("\r\n") + "\r\n");
        const blob2 = new Blob([bytes2], {
            type: "data:text/csv;charset=utf-8",
        });
        saveAs(blob2, "highlights.csv");
    }

    return (
        <div className="animate-fadein mt-2 flex max-w-2xl flex-col gap-4">
            <SettingsGroup
                title="About"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM296 336h-16V248C280 234.8 269.3 224 256 224H224C210.8 224 200 234.8 200 248S210.8 272 224 272h8v64h-16C202.8 336 192 346.8 192 360S202.8 384 216 384h80c13.25 0 24-10.75 24-24S309.3 336 296 336zM256 192c17.67 0 32-14.33 32-32c0-17.67-14.33-32-32-32S224 142.3 224 160C224 177.7 238.3 192 256 192z"
                        />
                    </svg>
                }
            >
                <p>
                    Every article you open with Unclutter gets automatically saved in your library.
                </p>

                <p>
                    See what you've read over the last weeks, get back to articles you didn't
                    finish, or review your highlights. It's all just one{" "}
                    <span
                        className="inline-block rounded-md bg-stone-200 px-1 font-medium dark:bg-neutral-700 dark:text-stone-800"
                        style={{
                            backgroundColor: getActivityColor(3, darkModeEnabled),
                        }}
                    >
                        TAB
                    </span>{" "}
                    press away.
                </p>
            </SettingsGroup>

            {userInfo.accountEnabled && (
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
                >
                    <>
                        <p>
                            You're signed in as {userInfo.email}.{" "}
                            {userInfo.onPaidPlan && (
                                <span>Thank you for supporting Unclutter!</span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            {userInfo.onPaidPlan && (
                                <Button
                                    title="Manage contribution"
                                    href="https://opencollective.com/unclutter"
                                    darkModeEnabled={darkModeEnabled}
                                    reportEvent={reportEvent}
                                />
                            )}
                            <Button
                                title="Import articles"
                                href="https://library.lindylearn.io/import"
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            />
                            <Button
                                title="Export data"
                                onClick={generateCSV}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            />
                        </div>
                    </>
                </SettingsGroup>
            )}

            {!userInfo.accountEnabled && (
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
                >
                    <>
                        <p>Your articles and highlights are saved in your local browser.</p>
                        <div className="flex gap-3">
                            {/* <Button
                                title="Create account"
                                href="https://library.lindylearn.io/signup"
                                isNew={(settings?.seen_settings_version || 0) < 2}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            /> */}
                            <Button
                                title="Export data"
                                onClick={generateCSV}
                                darkModeEnabled={darkModeEnabled}
                                reportEvent={reportEvent}
                            />
                        </div>
                    </>
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
            >
                <p>
                    Unclutter is open-source
                    {showSignup ? " and funded by the community" : ""}! Join our Discord server to
                    discuss improvements, or contribute on GitHub to improve reading on the web for
                    everyone.
                </p>

                <div className="flex gap-3">
                    <Button
                        title="Join Discord"
                        href="https://unclutter.it/discord"
                        darkModeEnabled={darkModeEnabled}
                        primary
                        reportEvent={reportEvent}
                    />
                    <Button
                        title="Open GitHub"
                        href="https://github.com/lindylearn/unclutter"
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                </div>
            </SettingsGroup>

            <SettingsGroup
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
                    placeholder="What could work better?"
                    ref={messageRef}
                />
                <div className="flex gap-3">
                    <Button
                        title="Send"
                        darkModeEnabled={darkModeEnabled}
                        onClick={submitReport}
                        reportEvent={reportEvent}
                    />
                </div>
            </SettingsGroup>
        </div>
    );
}

function SettingsGroup({
    title,
    icon,
    children,
    className,
}: {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={clsx(
                "relative z-20 rounded-md bg-stone-50 p-3 px-4 dark:bg-neutral-800",
                className
            )}
        >
            <h2 className="mb-2 flex items-center gap-2 font-medium">
                {icon}
                {title}
            </h2>
            <div className="flex flex-col gap-3">{children}</div>
        </div>
    );
}

function Button({
    title,
    href,
    onClick,
    primary,
    darkModeEnabled,
    isNew,
    reportEvent,
}: {
    title: string;
    href?: string;
    onClick?: () => void;
    primary?: boolean;
    darkModeEnabled: boolean;
    isNew?: boolean;
    reportEvent: (event: string, data?: any) => void;
}) {
    return (
        <a
            className={clsx(
                "relative cursor-pointer select-none rounded-md py-1 px-2 font-medium transition-transform hover:scale-[97%]",
                true && "dark:text-stone-800"
            )}
            style={{ background: getActivityColor(primary ? 3 : 3, false) }}
            onClick={() => {
                onClick?.();
                reportEvent("clickSettingsButton", { title });
            }}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
        >
            {title}

            {isNew && (
                <div className="bg-lindy dark:bg-lindyDark absolute -top-2 -right-5 z-20 rounded-md px-1 text-sm leading-tight dark:text-[rgb(232,230,227)]">
                    New
                </div>
            )}
        </a>
    );
}
