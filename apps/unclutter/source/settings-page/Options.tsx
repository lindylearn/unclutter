import React from "react";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    enableArchiveDetection,
    enableBootUnclutterMessage,
    enableSocialCountsFeatureFlag,
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
} from "../common/featureFlags";
import browser, { getBrowserType } from "../common/polyfill";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";
import ContributionStats from "./ContributionStats";
import DomainSettingsList from "./DomainSettingsList";
import FeatureFlagSwitch from "./FeatureFlagSwitch";
import HypothesisConfig from "./HypothesisConfig";
import { useAutoDarkMode } from "@unclutter/library-components/dist/common";
import clsx from "clsx";

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

    return (
        <div className={clsx(darkModeEnabled && "dark")}>
            <div className="flex flex-col gap-5 text-gray-900 dark:text-white">
                <OptionsGroup
                    headerText="Unclutter articles"
                    iconSvg={
                        <svg className="-ml-1.5 w-7" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M322.92,363.59a16.27,16.27,0,0,0-10.77-8.46l-.17,0c-23.11-6.31-45.14-9.5-65.49-9.5-44.82,0-72.15,15.56-84.45,24.84a32.81,32.81,0,0,1-19.91,6.68,33.32,33.32,0,0,1-29.87-18.77L46.67,221.94a7.44,7.44,0,0,0-11.58-2.39l-.17.14a16.48,16.48,0,0,0-4,19.61l94.43,195.75a16.25,16.25,0,0,0,26.79,3.69c56.59-63.15,138.33-60.33,168.87-56.83a6.46,6.46,0,0,0,6.5-9.34Z"
                                id="path835"
                            />
                            <path
                                fill="currentColor"
                                d="M475.18,278.79A7.44,7.44,0,0,0,481.37,267l-10.46-14.69a6.51,6.51,0,0,0-8.79-1.77,32.06,32.06,0,0,1-11.42,4.63c-31.45,6.08-60.35,22.79-85.91,49.66-19.72,20.74-29.87,40-29.94,40.16l0,0a4.63,4.63,0,0,0-.08,4.24l7.7,15.21a7.13,7.13,0,0,0,11.86,1.32c15.72-19,48.92-44.35,114.58-45.06a10,10,0,0,0,8.36-15.3l-15.83-25.17S465.41,278.6,475.18,278.79Z"
                                id="path837"
                            />
                            <path
                                fill="currentColor"
                                d="M302.84,323.94l-91.68-181a10.29,10.29,0,0,0-7-5.41c-28.58-6.21-90.13-10.64-144.4,45.71a13.33,13.33,0,0,0-2.44,15l72.86,151.5a13.26,13.26,0,0,0,19.94,4.85c20.47-15.44,67.41-39.75,147.22-23.39A5.07,5.07,0,0,0,302.84,323.94ZM119.08,185.38c1.36-1,33.75-25.12,73.77-13.24A8.51,8.51,0,1,1,188,188.45c-31.85-9.46-58.39,10.29-58.65,10.49a8.51,8.51,0,0,1-10.28-13.56Zm11.1,67.48a8.51,8.51,0,0,1-11.93-12.13c1.56-1.53,38.91-37.45,95.87-23.15a8.51,8.51,0,1,1-4.15,16.5C162.18,222.08,130.5,252.56,130.18,252.86ZM245.4,278.31a8.52,8.52,0,0,1-10.22,6.36c-39.57-9.23-65.79,9.09-66.05,9.28a8.51,8.51,0,0,1-9.9-13.85c1.32-.94,32.83-22.94,79.81-12A8.52,8.52,0,0,1,245.4,278.31Z"
                                id="path839"
                            />
                            <path
                                fill="currentColor"
                                d="M455.27,216.94,373.61,78.82A22.12,22.12,0,0,0,355.66,68c-24.58-1.22-81.18,3.17-126,61a10.24,10.24,0,0,0-1,10.89l90.41,178.51a5.06,5.06,0,0,0,8.68.59c17.6-25.31,57.22-71.26,119.17-83.24A12.59,12.59,0,0,0,455.27,216.94ZM288.44,163a8.51,8.51,0,1,1-13.2-10.74c.75-.91,18.56-22.57,43.07-31.1a8.5,8.5,0,0,1,5.6,16.06C303.91,144.15,288.59,162.77,288.44,163Zm13.1,43.4A8.53,8.53,0,0,1,295.25,193c.95-1.34,23.73-33,60-40.66a8.51,8.51,0,0,1,3.52,16.65c-29.86,6.32-49.47,33.58-49.66,33.85A8.52,8.52,0,0,1,301.54,206.36Zm90.79,5.12c-45.32,1.69-59.23,36.18-59.8,37.64a8.52,8.52,0,0,1-8.14,5.45,8.39,8.39,0,0,1-2.84-.56,8.49,8.49,0,0,1-4.93-10.92c.72-1.9,18.16-46.49,75.07-48.61a8.51,8.51,0,1,1,.64,17Z"
                                id="path841"
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
                    {/* <FeatureFlagSwitch featureFlagKey={enableArchiveDetection}>
                        Use{" "}
                        <a href="" className="underline" target="_blank" rel="noopener noreferrer">
                            web archives
                        </a>{" "}
                        to show unavailable articles
                    </FeatureFlagSwitch> */}
                    {/* <FeatureFlagSwitch featureFlagKey={enableBootUnclutterMessage}>
                        Show unclutter button on web pages{" "}
                        <a
                            href="https://github.com/lindylearn/unclutter/blob/main/docs/article-detection.md#unclutter-reminder"
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            that look like articles
                        </a>
                    </FeatureFlagSwitch> */}

                    <FeatureFlagSwitch
                        featureFlagKey={allowlistDomainOnManualActivationFeatureFlag}
                        onChange={setAutomaticActivationEnabled}
                    >
                        Automatically activate on websites you unclutter once
                    </FeatureFlagSwitch>
                    <DomainSettingsList />
                </OptionsGroup>

                <OptionsGroup
                    headerText="Your Library"
                    iconSvg={
                        <svg className="w-5" viewBox="0 0 576 512">
                            <path
                                fill="currentColor"
                                d="M540.9 56.77C493.8 39.74 449.6 31.58 410.9 32.02C352.2 32.96 308.3 50 288 59.74C267.7 50 223.9 32.98 165.2 32.04C125.8 31.35 82.18 39.72 35.1 56.77C14.02 64.41 0 84.67 0 107.2v292.1c0 16.61 7.594 31.95 20.84 42.08c13.73 10.53 31.34 13.91 48.2 9.344c118.1-32 202 22.92 205.5 25.2C278.6 478.6 283.3 480 287.1 480s9.37-1.359 13.43-4.078c3.516-2.328 87.59-57.21 205.5-25.25c16.92 4.563 34.5 1.188 48.22-9.344C568.4 431.2 576 415.9 576 399.2V107.2C576 84.67 561.1 64.41 540.9 56.77zM264 416.8c-27.86-11.61-69.84-24.13-121.4-24.13c-26.39 0-55.28 3.281-86.08 11.61C53.19 405.3 50.84 403.9 50 403.2C48 401.7 48 399.8 48 399.2V107.2c0-2.297 1.516-4.531 3.594-5.282c40.95-14.8 79.61-22.36 112.8-21.84C211.3 80.78 246.8 93.75 264 101.5V416.8zM528 399.2c0 .5938 0 2.422-2 3.969c-.8438 .6407-3.141 2.063-6.516 1.109c-90.98-24.6-165.4-5.032-207.5 12.53v-315.3c17.2-7.782 52.69-20.74 99.59-21.47c32.69-.5157 71.88 7.047 112.8 21.84C526.5 102.6 528 104.9 528 107.2V399.2z"
                            />
                        </svg>
                    }
                >
                    <p>
                        Press{" "}
                        <div
                            className="inline-block px-1 py-0.5 text-gray-600 shadow-inner dark:text-gray-300"
                            style={{ background: "var(--embedded-background)" }}
                        >
                            TAB
                        </div>{" "}
                        while reading to manage your saved articles and highlights.
                    </p>
                    <p>
                        Install{" "}
                        <a
                            href={unclutterLibraryLink}
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                                reportEventContentScript("clickNewTabLink", { source: "settings" })
                            }
                        >
                            Unclutter New Tab
                        </a>{" "}
                        to access your reading queue from your new tab page.
                    </p>
                </OptionsGroup>

                <OptionsGroup
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
                </OptionsGroup>

                <OptionsGroup
                    headerText="Contributions"
                    iconSvg={
                        <svg className="w-5" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84.02L256 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 .0003 232.4 .0003 190.9L0 190.9z"
                            />
                        </svg>
                    }
                >
                    <ContributionStats />
                    <div className="">
                        This project is open source! Add your ideas to our{" "}
                        <a
                            href="https://unclutter.canny.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            open roadmap
                        </a>{" "}
                        or contribute{" "}
                        <a
                            href="https://github.com/lindylearn/unclutter/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            on GitHub
                        </a>{" "}
                        to improve reading on the web for everyone.
                    </div>
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
                        <svg className="h-4 text-gray-400" viewBox="0 0 320 512">
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
