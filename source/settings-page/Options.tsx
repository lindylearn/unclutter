import React from "react";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
    enableBootUnclutterMessage,
    enableSocialCountsFeatureFlag,
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
    showOutlineFeatureFlag,
    supportSocialAnnotations,
} from "../common/featureFlags";
import browser, { getBrowserType } from "../common/polyfill";
import {
    getRemoteFeatureFlag,
    reportEventContentScript,
} from "../content-script/messaging";
import DomainSettingsList from "./DomainSettingsList";
import FeatureFlagSwitch from "./FeatureFlagSwitch";
import HypothesisConfig from "./HypothesisConfig";

function OptionsPage({}) {
    React.useEffect(() => {
        reportEventContentScript("openSettings");
    }, []);

    const [socialAnnotationsSupported, setSocialAnnotationsSupported] =
        React.useState(null);
    React.useEffect(() => {
        (async function () {
            const enabled = await getRemoteFeatureFlag(
                supportSocialAnnotations
            );
            setSocialAnnotationsSupported(enabled);
        })();
    }, []);

    const [hypothesisEnabled, setHypothesisEnabled] = React.useState(null);
    React.useEffect(() => {
        (async function () {
            const enabled = await getFeatureFlag(hypothesisSyncFeatureFlag);
            setHypothesisEnabled(enabled);
        })();
    }, []);
    function onChangeHypothesisSync(enabled) {
        setHypothesisEnabled(enabled);
    }

    // to get actual the shortcut we'd need to use a custom command other than '_execute_action'
    const [keyboardShortcut, setKeyboardShortcut] = React.useState("");
    browser.runtime
        .getPlatformInfo()
        .then(({ os }) => setKeyboardShortcut(os === "mac" ? "⌥+C" : "Alt+C"));

    const keyboardShortcutsUrl =
        getBrowserType() === "chromium"
            ? "chrome://extensions/shortcuts"
            : "https://support.mozilla.org/en-US/kb/manage-extension-shortcuts-firefox";

    return (
        <div className="flex flex-col gap-3 dark:text-white">
            <OptionsGroup
                headerText="Global Settings"
                iconSvg={
                    <svg className="w-5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z"
                        />
                    </svg>
                }
            >
                <p>
                    Unclutter articles by clicking the extension icon or
                    pressing{" "}
                    <div className="inline-block px-1 py-0.5 bg-gray-100 dark:bg-gray-800 shadow-inner text-gray-600 dark:text-gray-300">
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
                <FeatureFlagSwitch featureFlagKey={enableBootUnclutterMessage}>
                    Show unclutter reminder on web pages{" "}
                    <a
                        href="https://github.com/lindylearn/unclutter/tree/main/docs/article-detection.md"
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        that look like articles
                    </a>
                </FeatureFlagSwitch>
                <FeatureFlagSwitch featureFlagKey={showOutlineFeatureFlag}>
                    Show interactive article outline where available
                </FeatureFlagSwitch>
            </OptionsGroup>

            <OptionsGroup
                headerText="Automatic Activation"
                iconSvg={
                    <svg className="w-5 ml-0.5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M240.5 224H352C365.3 224 377.3 232.3 381.1 244.7C386.6 257.2 383.1 271.3 373.1 280.1L117.1 504.1C105.8 513.9 89.27 514.7 77.19 505.9C65.1 497.1 60.7 481.1 66.59 467.4L143.5 288H31.1C18.67 288 6.733 279.7 2.044 267.3C-2.645 254.8 .8944 240.7 10.93 231.9L266.9 7.918C278.2-1.92 294.7-2.669 306.8 6.114C318.9 14.9 323.3 30.87 317.4 44.61L240.5 224z"
                        />
                    </svg>
                }
            >
                <p className="">
                    To automatically unclutter pages on a certain domain, click
                    the "bolt" icon next to each article.
                </p>

                <FeatureFlagSwitch
                    featureFlagKey={
                        allowlistDomainOnManualActivationFeatureFlag
                    }
                >
                    Always add the current domain when you unclutter a page
                </FeatureFlagSwitch>
                <DomainSettingsList />
            </OptionsGroup>

            <OptionsGroup
                headerText="Private Notes"
                iconSvg={
                    <svg className="w-5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M320 62.06L362.7 19.32C387.7-5.678 428.3-5.678 453.3 19.32L492.7 58.75C517.7 83.74 517.7 124.3 492.7 149.3L229.5 412.5C181.5 460.5 120.3 493.2 53.7 506.5L28.71 511.5C20.84 513.1 12.7 510.6 7.03 504.1C1.356 499.3-1.107 491.2 .4662 483.3L5.465 458.3C18.78 391.7 51.52 330.5 99.54 282.5L286.1 96L272.1 82.91C263.6 73.54 248.4 73.54 239 82.91L136.1 184.1C127.6 194.3 112.4 194.3 103 184.1C93.66 175.6 93.66 160.4 103 151L205.1 48.97C233.2 20.85 278.8 20.85 306.9 48.97L320 62.06zM320 129.9L133.5 316.5C94.71 355.2 67.52 403.1 54.85 457.2C108 444.5 156.8 417.3 195.5 378.5L382.1 192L320 129.9z"
                        />
                    </svg>
                }
            >
                <p>
                    Highlight any article text to create a private note saved in
                    your browser. Toggle the feature via the toolbar in the top
                    right of the article view.
                </p>
                <FeatureFlagSwitch
                    featureFlagKey={hypothesisSyncFeatureFlag}
                    onChange={onChangeHypothesisSync}
                >
                    Sync notes with my{" "}
                    <a
                        href="https://web.hypothes.is"
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Hypothes.is
                    </a>{" "}
                    account (
                    <a
                        href="https://github.com/lindylearn/unclutter/blob/main/docs/annotations.md"
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        why
                    </a>
                    )
                </FeatureFlagSwitch>
                {hypothesisEnabled && <HypothesisConfig />}
            </OptionsGroup>

            {socialAnnotationsSupported && (
                <OptionsGroup
                    headerText="Social Highlights"
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
                        Click the underlined text on 55.688 supported articles
                        to show related conversations from Hacker News and
                        Hypothes.is (
                        <a
                            href="https://github.com/lindylearn/unclutter/blob/main/docs/social-highlights.md"
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            here's how this works
                        </a>
                        )
                    </p>
                    <FeatureFlagSwitch
                        featureFlagKey={enableSocialCountsFeatureFlag}
                    >
                        Show the number of social highlights on the extension
                        icon
                    </FeatureFlagSwitch>
                </OptionsGroup>
            )}

            <OptionsGroup
                headerText="Other"
                iconSvg={
                    <svg className="w-5" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M0 190.9V185.1C0 115.2 50.52 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84.02L256 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461.5 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 .0003 232.4 .0003 190.9L0 190.9z"
                        />
                    </svg>
                }
            >
                <div className="">
                    This project is open source! Please post issues and feature
                    ideas{" "}
                    <a
                        href="https://github.com/lindylearn/unclutter"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        on GitHub
                    </a>
                    .
                </div>
                <FeatureFlagSwitch
                    featureFlagKey={collectAnonymousMetricsFeatureFlag}
                >
                    Collect anonymous{" "}
                    <a
                        href="https://github.com/lindylearn/unclutter/tree/main/docs/metrics.md"
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        usage statistics
                    </a>{" "}
                    to make the extension better
                </FeatureFlagSwitch>
            </OptionsGroup>
        </div>
    );
}
export default OptionsPage;

function OptionsGroup({ headerText, iconSvg, children }) {
    return (
        <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center">
                <div className="w-7">{iconSvg}</div>
                {headerText}
            </h2>
            <div className="ml-7 mr-5 flex flex-col gap-2">{children}</div>
        </div>
    );
}
