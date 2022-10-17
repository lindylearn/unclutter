import clsx from "clsx";
import React, { ReactNode, useRef, useState } from "react";
import { quickReport } from "../../common";
import { UserInfo } from "../../store/user";
import { getActivityColor } from "../Charts";

export default function SettingsModalTab({
    userInfo,
    currentArticle,
    darkModeEnabled,
    showSignup,
}: {
    userInfo: UserInfo;
    currentArticle?: string;
    darkModeEnabled: boolean;
    showSignup: boolean;
}) {
    const [bugReportOpen, setBugReportOpen] = useState(false);
    const messageRef = useRef<HTMLTextAreaElement>(null);
    async function submitReport() {
        if (!messageRef.current?.value) {
            return;
        }
        const issueUrl = await quickReport(
            messageRef.current.value,
            currentArticle,
            userInfo.id
        );

        if (issueUrl) {
            window.open(issueUrl, "_blank")?.focus();
        }
        messageRef.current.value = "";
        setBugReportOpen(false);
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
                    Every article you open with Unclutter gets automatically
                    saved in your library.
                </p>

                <p>
                    See what you've read over the last weeks, get back to
                    articles you didn't finish, or review your highlights. It's
                    all just one{" "}
                    <span
                        className="inline-block rounded-md bg-stone-200 px-1 dark:bg-neutral-700"
                        style={{
                            backgroundColor: getActivityColor(
                                1,
                                darkModeEnabled
                            ),
                        }}
                    >
                        TAB
                    </span>{" "}
                    press away.
                </p>
            </SettingsGroup>

            <SettingsGroup
                title="Account"
                icon={
                    <svg className="h-4 w-4" viewBox="0 0 448 512">
                        <path
                            fill="currentColor"
                            d="M272 304h-96C78.8 304 0 382.8 0 480c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32C448 382.8 369.2 304 272 304zM48.99 464C56.89 400.9 110.8 352 176 352h96c65.16 0 119.1 48.95 127 112H48.99zM224 256c70.69 0 128-57.31 128-128c0-70.69-57.31-128-128-128S96 57.31 96 128C96 198.7 153.3 256 224 256zM224 48c44.11 0 80 35.89 80 80c0 44.11-35.89 80-80 80S144 172.1 144 128C144 83.89 179.9 48 224 48z"
                        />
                    </svg>
                }
            >
                {userInfo.accountEnabled ? (
                    <>
                        <p>
                            You're signed in. Your library is synchronized and
                            available everywhere.
                        </p>
                        {/* <div className="flex gap-2">
                                <Button
                                    title="Sign out"
                                    darkModeEnabled={darkModeEnabled}
                                />
                            </div> */}
                    </>
                ) : (
                    <>
                        <p>
                            Right now, articles you visit are only saved in your
                            browser. Create an account to back-up and access
                            your library across devices.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                title="Create account"
                                href="https://library.lindylearn.io/signup"
                                darkModeEnabled={darkModeEnabled}
                            />
                        </div>
                    </>
                )}
            </SettingsGroup>

            {/* {!userInfo.onPaidPlan && (
                <SettingsGroup
                    title="Features"
                    icon={
                        <svg className="h-4" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
                            />
                        </svg>
                    }
                >
                    <p>
                        Want to see your reading queue on your browser's new tab
                        page?
                    </p>
                    <div className="flex gap-2">
                        <Button title="Sign out" />
                        <Button title="Export data" />
                    </div>
                </SettingsGroup>
            )} */}

            {/* <SettingsGroup title="Unclutter">
                Configure the reader mode via the extension settings.
            </SettingsGroup> */}

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
                    {showSignup ? " and funded by the community" : ""}! Vote on
                    the roadmap, suggest features, or report bugs to make it
                    better for everyone.
                </p>

                <div className="flex gap-2">
                    <Button
                        title="Open GitHub"
                        href="https://github.com/lindylearn/unclutter"
                        darkModeEnabled={darkModeEnabled}
                    />
                    <Button
                        title="View roadmap"
                        href="https://unclutter.canny.io/"
                        darkModeEnabled={darkModeEnabled}
                    />
                    <Button
                        title="Report issue"
                        onClick={() => setBugReportOpen(!bugReportOpen)}
                        darkModeEnabled={darkModeEnabled}
                    />
                </div>
            </SettingsGroup>

            {bugReportOpen && (
                <div className="relative -translate-y-[100%]">
                    <SettingsGroup
                        title="Report issue"
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
                            placeholder="What is wrong or could work better?"
                            ref={messageRef}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                title="Send"
                                darkModeEnabled={darkModeEnabled}
                                onClick={submitReport}
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
                "z-20 rounded-md bg-stone-50 p-3 px-4 dark:bg-neutral-800",
                className
            )}
        >
            <h2 className="mb-2 flex items-center gap-2 font-medium">
                {icon}
                {title}
            </h2>
            <div className="flex flex-col gap-2">{children}</div>
        </div>
    );
}

function Button({
    title,
    href,
    onClick,
    primary,
    darkModeEnabled,
}: {
    title: string;
    href?: string;
    onClick?: () => void;
    primary?: boolean;
    darkModeEnabled: boolean;
}) {
    return (
        <a
            className={clsx(
                "cursor-pointer select-none rounded-md py-1 px-2 font-medium transition-transform hover:scale-[97%]",
                primary && "dark:text-stone-800"
            )}
            style={{ background: getActivityColor(primary ? 4 : 1, false) }}
            onClick={onClick}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
        >
            {title}
        </a>
    );
}
