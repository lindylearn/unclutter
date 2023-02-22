import React, { useEffect } from "react";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
} from "../common/featureFlags";
import { getUserInfoSimple } from "@unclutter/library-components/dist/common/messaging";
import browser, { getBrowserType } from "../common/polyfill";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import ContributionStats from "./ContributionStats";
import DomainSettingsList from "./DomainSettingsList";
import FeatureFlagSwitch from "./FeatureFlagSwitch";
import HypothesisConfig from "./HypothesisConfig";
import { useAutoDarkMode } from "@unclutter/library-components/dist/common/hooks";
import clsx from "clsx";
import { getHypothesisSyncState, SyncState } from "../common/storage";
import { getRelativeTime } from "../common/time";
import type { UserInfo } from "@unclutter/library-components/dist/store";

function OptionsPage({}) {
    React.useEffect(() => {
        reportEventContentScript("openSettings");
    }, []);

    const [automaticActivationEnabled, setAutomaticActivationEnabled] = React.useState(null);
    React.useEffect(() => {
        getFeatureFlag(allowlistDomainOnManualActivationFeatureFlag).then(
            setAutomaticActivationEnabled
        );
    }, []);

    // to get actual the shortcut we'd need to use a custom command other than '_execute_action'
    const [keyboardShortcut, setKeyboardShortcut] = React.useState("");
    browser.runtime
        .getPlatformInfo()
        .then(({ os }) => setKeyboardShortcut(os === "mac" ? "⌥+C" : "Alt+C"));

    const keyboardShortcutsUrl =
        getBrowserType() === "chromium"
            ? "chrome://extensions/shortcuts"
            : "https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox";
    const unclutterLibraryLink =
        getBrowserType() === "firefox"
            ? "https://addons.mozilla.org/en-GB/firefox/addon/unclutter-library"
            : "https://chrome.google.com/webstore/detail/bghgkooimeljolohebojceacblokenjn";

    const darkModeEnabled = useAutoDarkMode();

    const [userInfo, setUserInfo] = React.useState<UserInfo>();
    useEffect(() => {
        getUserInfoSimple().then(setUserInfo);
    }, []);

    return (
        <div className={clsx(darkModeEnabled && "dark")}>
            <div className="flex flex-col gap-5 text-gray-900 dark:text-white">
                <OptionsGroup
                    headerText="Automatic activation"
                    iconSvg={
                        <svg className="h-5 w-5" viewBox="0 0 384 512">
                            <path
                                fill="currentColor"
                                d="M289.7 .0006C308.8 .0006 322.6 18.26 317.4 36.61L263.8 224H349.1C368.4 224 384 239.6 384 258.9C384 269.2 379.5 278.9 371.7 285.6L112.9 505.2C107.7 509.6 101.1 512 94.27 512C75.18 512 61.4 493.7 66.64 475.4L120.2 288H33.74C15.1 288 0 272.9 0 254.3C0 244.4 4.315 235 11.81 228.6L271.1 6.893C276.3 2.445 282.9 0 289.7 0V.0006zM253.6 84.99L72.36 240H152C159.5 240 166.6 243.5 171.2 249.5C175.7 255.6 177.1 263.4 175.1 270.6L130.3 427.5L313.5 272H232C224.5 272 217.4 268.5 212.8 262.5C208.3 256.4 206.9 248.6 208.9 241.4L253.6 84.99z"
                            />
                        </svg>
                    }
                >
                    <p>
                        Unclutter articles by clicking the extension icon or pressing{" "}
                        <div
                            className="inline-block px-1 py-0.5 text-gray-600 shadow-inner dark:text-gray-300"
                            style={{ background: "var(--embedded-background)" }}
                        >
                            {keyboardShortcut}
                        </div>{" "}
                        (
                        <a
                            href={keyboardShortcutsUrl}
                            className="underline"
                            onClick={(e) => {
                                // cannot open chrome:// urls via <a> link
                                browser.tabs.create({
                                    url: keyboardShortcutsUrl,
                                });
                                e.preventDefault();
                            }}
                        >
                            customize
                        </a>
                        )
                    </p>
                    <FeatureFlagSwitch
                        featureFlagKey={allowlistDomainOnManualActivationFeatureFlag}
                        onChange={setAutomaticActivationEnabled}
                    >
                        Automatically activate on websites you unclutter once
                    </FeatureFlagSwitch>
                    <DomainSettingsList />
                </OptionsGroup>

                {userInfo?.aiEnabled ? (
                    <OptionsGroup
                        headerText="Unclutter Library"
                        iconSvg={
                            <svg className="h-5 w-5" viewBox="0 0 576 512">
                                <path
                                    fill="currentColor"
                                    d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                                />
                            </svg>
                        }
                    >
                        <p>
                            You're logged in as{" "}
                            <div
                                className="inline-block px-1 py-0.5 text-gray-600 shadow-inner dark:text-gray-300"
                                style={{ background: "var(--embedded-background)" }}
                            >
                                {userInfo?.email}
                            </div>
                        </p>
                        <p>
                            Access your Unclutter Library by visiting{" "}
                            <a
                                href="https://my.unclutter.it"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                my.unclutter.it
                            </a>
                            , pressing{" "}
                            <div
                                className="inline-block px-1 py-0.5 text-gray-600 shadow-inner dark:text-gray-300"
                                style={{ background: "var(--embedded-background)" }}
                            >
                                TAB
                            </div>{" "}
                            inside the reader mode, or right-clicking the Unclutter extension icon.
                        </p>
                        <p>
                            Install the{" "}
                            <a
                                href={unclutterLibraryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                New Tab extension
                            </a>{" "}
                            to more easily access your reading queue.
                        </p>
                    </OptionsGroup>
                ) : (
                    <OptionsGroup
                        headerText="Get more value out of reading"
                        iconSvg={
                            <svg className="h-5 w-5" viewBox="0 0 576 512">
                                <path
                                    fill="currentColor"
                                    d="M248.8 4.994C249.9 1.99 252.8 .0001 256 .0001C259.2 .0001 262.1 1.99 263.2 4.994L277.3 42.67L315 56.79C318 57.92 320 60.79 320 64C320 67.21 318 70.08 315 71.21L277.3 85.33L263.2 123C262.1 126 259.2 128 256 128C252.8 128 249.9 126 248.8 123L234.7 85.33L196.1 71.21C193.1 70.08 192 67.21 192 64C192 60.79 193.1 57.92 196.1 56.79L234.7 42.67L248.8 4.994zM495.3 14.06L529.9 48.64C548.6 67.38 548.6 97.78 529.9 116.5L148.5 497.9C129.8 516.6 99.38 516.6 80.64 497.9L46.06 463.3C27.31 444.6 27.31 414.2 46.06 395.4L427.4 14.06C446.2-4.686 476.6-4.686 495.3 14.06V14.06zM461.4 48L351.7 157.7L386.2 192.3L495.1 82.58L461.4 48zM114.6 463.1L352.3 226.2L317.7 191.7L80 429.4L114.6 463.1zM7.491 117.2L64 96L85.19 39.49C86.88 34.98 91.19 32 96 32C100.8 32 105.1 34.98 106.8 39.49L128 96L184.5 117.2C189 118.9 192 123.2 192 128C192 132.8 189 137.1 184.5 138.8L128 160L106.8 216.5C105.1 221 100.8 224 96 224C91.19 224 86.88 221 85.19 216.5L64 160L7.491 138.8C2.985 137.1 0 132.8 0 128C0 123.2 2.985 118.9 7.491 117.2zM359.5 373.2L416 352L437.2 295.5C438.9 290.1 443.2 288 448 288C452.8 288 457.1 290.1 458.8 295.5L480 352L536.5 373.2C541 374.9 544 379.2 544 384C544 388.8 541 393.1 536.5 394.8L480 416L458.8 472.5C457.1 477 452.8 480 448 480C443.2 480 438.9 477 437.2 472.5L416 416L359.5 394.8C354.1 393.1 352 388.8 352 384C352 379.2 354.1 374.9 359.5 373.2z"
                                />
                            </svg>
                        }
                    >
                        <p>
                            Create an{" "}
                            <a
                                href="https://my.unclutter.it/signup"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                Unclutter Library account
                            </a>{" "}
                            to get more value out of reading by automatically saving, organizing,
                            and connecting related article quotes.
                        </p>
                        <p>
                            This includes AI highlighting, automatic tagging, searching across
                            everything you've read, syncing with Pocket, Hypothes.is, Obsidian and
                            more.
                        </p>
                    </OptionsGroup>
                )}

                {/* <OptionsGroup
                    headerText="Social comments"
                    iconSvg={
                        <svg className="w-5" viewBox="0 0 640 512">
                            <path
                                fill="currentColor"
                                d="M319.9 320c57.41 0 103.1-46.56 103.1-104c0-57.44-46.54-104-103.1-104c-57.41 0-103.1 46.56-103.1 104C215.9 273.4 262.5 320 319.9 320zM319.9 160c30.85 0 55.96 25.12 55.96 56S350.7 272 319.9 272S263.9 246.9 263.9 216S289 160 319.9 160zM512 160c44.18 0 80-35.82 80-80S556.2 0 512 0c-44.18 0-80 35.82-80 80S467.8 160 512 160zM369.9 352H270.1C191.6 352 128 411.7 128 485.3C128 500.1 140.7 512 156.4 512h327.2C499.3 512 512 500.1 512 485.3C512 411.7 448.4 352 369.9 352zM178.1 464c10.47-36.76 47.36-64 91.14-64H369.9c43.77 0 80.66 27.24 91.14 64H178.1zM551.9 192h-61.84c-12.8 0-24.88 3.037-35.86 8.24C454.8 205.5 455.8 210.6 455.8 216c0 33.71-12.78 64.21-33.16 88h199.7C632.1 304 640 295.6 640 285.3C640 233.8 600.6 192 551.9 192zM183.9 216c0-5.449 .9824-10.63 1.609-15.91C174.6 194.1 162.6 192 149.9 192H88.08C39.44 192 0 233.8 0 285.3C0 295.6 7.887 304 17.62 304h199.5C196.7 280.2 183.9 249.7 183.9 216zM128 160c44.18 0 80-35.82 80-80S172.2 0 128 0C83.82 0 48 35.82 48 80S83.82 160 128 160z"
                            />
                        </svg>
                    }
                >
                    <p>
                        Click the underlined quotes on 86,457+ supported articles to show{" "}
                        <a
                            href="https://github.com/lindylearn/unclutter/blob/main/docs/social-highlights.md"
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            quote comments
                        </a>{" "}
                        from Hacker News and Hypothes.is.
                    </p>
                    <FeatureFlagSwitch featureFlagKey={enableSocialCountsFeatureFlag}>
                        Show number of available social comments on the extension icon
                    </FeatureFlagSwitch>
                </OptionsGroup> */}

                <OptionsGroup
                    headerText="Contribute to Unclutter"
                    iconSvg={
                        <svg className="h-5 w-5" viewBox="0 0 496 512">
                            <path
                                fill="currentColor"
                                d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
                            />
                        </svg>
                    }
                >
                    <div className="">
                        Unclutter is open source! Join our{" "}
                        <a
                            href="https://unclutter.it/discord"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            Discord server
                        </a>{" "}
                        to discuss improvements or contribute{" "}
                        <a
                            href="https://github.com/lindylearn/unclutter/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            on GitHub
                        </a>{" "}
                        to help improve reading on the web!
                    </div>
                    <ContributionStats />
                </OptionsGroup>
            </div>
        </div>
    );
}
export default OptionsPage;

function OptionsGroup({ headerText, iconSvg, children, docsLink = null }) {
    return (
        <div>
            <h2 className="mb-1 flex select-none items-center text-lg font-semibold">
                <div className="group-icon mr-1 w-7">{iconSvg}</div>
                <div className="group-title">{headerText}</div>
                {docsLink && (
                    <a href={docsLink} target="_blank" rel="noopener noreferrer" className="ml-5">
                        <svg className="h-5 text-gray-400" viewBox="0 0 320 512">
                            <path
                                fill="currentColor"
                                d="M144 416c-17.67 0-32 14.33-32 32s14.33 32.01 32 32.01s32-14.34 32-32.01S161.7 416 144 416zM211.2 32H104C46.66 32 0 78.66 0 136v16C0 165.3 10.75 176 24 176S48 165.3 48 152v-16c0-30.88 25.12-56 56-56h107.2C244.7 80 272 107.3 272 140.8c0 22.66-12.44 43.27-32.5 53.81L167 232.8C137.1 248 120 277.9 120 310.6V328c0 13.25 10.75 24.01 24 24.01S168 341.3 168 328V310.6c0-14.89 8.188-28.47 21.38-35.41l72.47-38.14C297.7 218.2 320 181.3 320 140.8C320 80.81 271.2 32 211.2 32z"
                            />
                        </svg>
                    </a>
                )}
            </h2>
            <div className="ml-8 mr-5 flex flex-col gap-2">{children}</div>
        </div>
    );
}
