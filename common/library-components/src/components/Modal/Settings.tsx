import clsx from "clsx";
import React, { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { getBrowserType, quickReport } from "../../common";
import { latestSettingsVersion, ReplicacheContext, Settings, UserInfo } from "../../store";
import { getActivityColor } from "../Charts";
import { saveAs } from "file-saver";

export default function SettingsModalTab({
    userInfo,
    currentArticle,
    darkModeEnabled,
    showSignup,
    reportEvent = () => {},
}: {
    userInfo: UserInfo;
    currentArticle?: string;
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

    const [bugReportOpen, setBugReportOpen] = useState(false);
    const messageRef = useRef<HTMLTextAreaElement>(null);
    async function submitReport() {
        if (!messageRef.current?.value) {
            return;
        }
        const issueUrl = await quickReport(messageRef.current.value, currentArticle, userInfo.id);

        if (issueUrl) {
            window.open(issueUrl, "_blank")?.focus();
        }
        messageRef.current.value = "";
        setBugReportOpen(false);
    }

    const unclutterLibraryLink =
        getBrowserType() === "firefox"
            ? "https://addons.mozilla.org/en-GB/firefox/addon/unclutter-library"
            : "https://chrome.google.com/webstore/detail/bghgkooimeljolohebojceacblokenjn";

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
                        className="inline-block rounded-md bg-stone-200 px-1 font-medium dark:bg-neutral-700"
                        style={{
                            backgroundColor: getActivityColor(1, darkModeEnabled),
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
                            <Button
                                title="Import articles"
                                href="https://library.lindylearn.io/import"
                                // isNew={(settings?.seen_settings_version || 0) < 2}
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
                title="Customization"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M0 416C0 402.7 10.75 392 24 392H83.66C93.86 359.5 124.2 336 160 336C195.8 336 226.1 359.5 236.3 392H488C501.3 392 512 402.7 512 416C512 429.3 501.3 440 488 440H236.3C226.1 472.5 195.8 496 160 496C124.2 496 93.86 472.5 83.66 440H24C10.75 440 0 429.3 0 416zM192 416C192 398.3 177.7 384 160 384C142.3 384 128 398.3 128 416C128 433.7 142.3 448 160 448C177.7 448 192 433.7 192 416zM352 176C387.8 176 418.1 199.5 428.3 232H488C501.3 232 512 242.7 512 256C512 269.3 501.3 280 488 280H428.3C418.1 312.5 387.8 336 352 336C316.2 336 285.9 312.5 275.7 280H24C10.75 280 0 269.3 0 256C0 242.7 10.75 232 24 232H275.7C285.9 199.5 316.2 176 352 176zM384 256C384 238.3 369.7 224 352 224C334.3 224 320 238.3 320 256C320 273.7 334.3 288 352 288C369.7 288 384 273.7 384 256zM488 72C501.3 72 512 82.75 512 96C512 109.3 501.3 120 488 120H268.3C258.1 152.5 227.8 176 192 176C156.2 176 125.9 152.5 115.7 120H24C10.75 120 0 109.3 0 96C0 82.75 10.75 72 24 72H115.7C125.9 39.54 156.2 16 192 16C227.8 16 258.1 39.54 268.3 72H488zM160 96C160 113.7 174.3 128 192 128C209.7 128 224 113.7 224 96C224 78.33 209.7 64 192 64C174.3 64 160 78.33 160 96z"
                        />
                    </svg>
                }
            >
                <p>Do you want to access your library from your browser's new tab page?</p>
                <div className="flex gap-3">
                    <Button
                        title="Install New Tab"
                        href={unclutterLibraryLink}
                        darkModeEnabled={darkModeEnabled}
                        isNew={(settings?.seen_settings_version || 0) < 1}
                        reportEvent={reportEvent}
                    />
                </div>
            </SettingsGroup>

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
                    {showSignup ? " and funded by the community" : ""}! Suggest features, contribute
                    code, vote on the roadmap, or report bugs to make it better for everyone.
                </p>

                <div className="flex gap-3">
                    <Button
                        title="Open GitHub"
                        href="https://github.com/lindylearn/unclutter"
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                    <Button
                        title="View roadmap"
                        href="https://unclutter.canny.io/"
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                    <Button
                        title="Give feedback"
                        onClick={() => setBugReportOpen(!bugReportOpen)}
                        darkModeEnabled={darkModeEnabled}
                        reportEvent={reportEvent}
                    />
                </div>
            </SettingsGroup>

            {bugReportOpen && (
                <div className="relative -translate-y-[100%]">
                    <SettingsGroup
                        title="Give feedback"
                        icon={
                            <svg className="h-4 w-4" viewBox="0 0 512 512">
                                <path
                                    fill="currentColor"
                                    d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
                                />
                            </svg>
                        }
                        className="animate-[easeOutBounce_0.75s_both]"
                    >
                        <textarea
                            className="my-1 h-32 w-full rounded-md p-3 placeholder-neutral-400 outline-none dark:bg-[#212121] dark:placeholder-neutral-500"
                            placeholder="What do you think about Unclutter? What could work better?"
                            ref={messageRef}
                        />
                        <div className="flex justify-end gap-3">
                            <Button
                                title="Send"
                                darkModeEnabled={darkModeEnabled}
                                onClick={submitReport}
                                reportEvent={reportEvent}
                            />
                        </div>
                    </SettingsGroup>
                </div>
            )}
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
                primary && "dark:text-stone-800"
            )}
            style={{ background: getActivityColor(primary ? 4 : 1, false) }}
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
