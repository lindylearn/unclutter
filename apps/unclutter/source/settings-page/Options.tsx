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
                        <svg className="-ml-1.5 w-7" viewBox="0 0 454.29309 347.4881">
                            <g
                                id="g835"
                                transform="matrix(0.97358134,0.22834049,-0.24748059,1.0551895,29.203185,-107.44255)"
                            >
                                <path
                                    d="m 302.84,323.94 -91.68,-181 a 10.29,10.29 0 0 0 -7,-5.41 c -28.58,-6.21 -90.13,-10.64 -144.4,45.71 a 13.33,13.33 0 0 0 -2.44,15 l 72.86,151.5 a 13.26,13.26 0 0 0 19.94,4.85 c 20.47,-15.44 67.41,-39.75 147.22,-23.39 a 5.07,5.07 0 0 0 5.5,-7.26 z M 119.08,185.38 c 1.36,-1 33.75,-25.12 73.77,-13.24 A 8.51,8.51 0 1 1 188,188.45 c -31.85,-9.46 -58.39,10.29 -58.65,10.49 a 8.51,8.51 0 0 1 -10.28,-13.56 z m 11.1,67.48 a 8.51,8.51 0 0 1 -11.93,-12.13 c 1.56,-1.53 38.91,-37.45 95.87,-23.15 a 8.51,8.51 0 1 1 -4.15,16.5 c -47.79,-12 -79.47,18.48 -79.79,18.78 z m 115.22,25.45 a 8.52,8.52 0 0 1 -10.22,6.36 c -39.57,-9.23 -65.79,9.09 -66.05,9.28 a 8.5122338,8.5122338 0 0 1 -9.9,-13.85 c 1.32,-0.94 32.83,-22.94 79.81,-12 a 8.52,8.52 0 0 1 6.36,10.21 z"
                                    id="path839"
                                />
                                <path
                                    d="M 455.27,216.94 373.61,78.82 A 22.12,22.12 0 0 0 355.66,68 c -24.58,-1.22 -81.18,3.17 -126,61 a 10.24,10.24 0 0 0 -1,10.89 l 90.41,178.51 a 5.06,5.06 0 0 0 8.68,0.59 c 17.6,-25.31 57.22,-71.26 119.17,-83.24 a 12.59,12.59 0 0 0 8.35,-18.81 z M 288.44,163 a 8.51,8.51 0 1 1 -13.2,-10.74 c 0.75,-0.91 18.56,-22.57 43.07,-31.1 a 8.5041696,8.5041696 0 0 1 5.6,16.06 c -20,6.93 -35.32,25.55 -35.47,25.78 z m 13.1,43.4 A 8.53,8.53 0 0 1 295.25,193 c 0.95,-1.34 23.73,-33 60,-40.66 a 8.51,8.51 0 0 1 3.52,16.65 c -29.86,6.32 -49.47,33.58 -49.66,33.85 a 8.52,8.52 0 0 1 -7.57,3.52 z m 90.79,5.12 c -45.32,1.69 -59.23,36.18 -59.8,37.64 a 8.52,8.52 0 0 1 -8.14,5.45 8.39,8.39 0 0 1 -2.84,-0.56 8.49,8.49 0 0 1 -4.93,-10.92 c 0.72,-1.9 18.16,-46.49 75.07,-48.61 a 8.51,8.51 0 1 1 0.64,17 z"
                                    id="path841"
                                />
                            </g>
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
                        <svg className="w-5" viewBox="0 0 640 512">
                            <path
                                fill="currentColor"
                                d="M443.5 17.94C409.8 5.608 375.3 0 341.4 0C250.1 0 164.6 41.44 107.1 112.1c-6.752 8.349-2.752 21.07 7.375 24.68C303.1 203.8 447.4 258.3 618.4 319.1c1.75 .623 3.623 .9969 5.5 .9969c8.25 0 15.88-6.355 16-15.08C643 180.7 567.2 62.8 443.5 17.94zM177.1 108.4c42.88-36.51 97.76-58.07 154.5-60.19c-4.5 3.738-36.88 28.41-70.25 90.72L177.1 108.4zM452.6 208.1L307.4 155.4c14.25-25.17 30.63-47.23 48.13-63.8c25.38-23.93 50.13-34.02 67.51-27.66c17.5 6.355 29.75 29.78 33.75 64.42C459.6 152.4 457.9 179.6 452.6 208.1zM497.8 224.4c7.375-34.89 12.13-76.76 4.125-117.9c45.75 38.13 77.13 91.34 86.88 150.9L497.8 224.4zM576 488.1C576 501.3 565.3 512 552 512L23.99 510.4c-13.25 0-24-10.72-24-23.93c0-13.21 10.75-23.93 24-23.93l228 .6892l78.35-214.8l45.06 16.5l-72.38 198.4l248.1 .7516C565.3 464.1 576 474.9 576 488.1z"
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
                                d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84C243.1 84 244 84.01 244 84L244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"
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
