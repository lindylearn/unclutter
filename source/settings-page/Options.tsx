import React from "react";
import {
    getRemoteFeatureFlag,
    reportEventContentScript,
} from "source/content-script/messaging";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
    enableBootUnclutterMessage,
    getFeatureFlag,
    hypothesisSyncFeatureFlag,
    showOutlineFeatureFlag,
    showSocialAnnotationsDefaultFeatureFlag,
    supportSocialAnnotations,
} from "../common/featureFlags";
import DomainSettingsList from "./DomainSettingsList";
import FeatureFlagSwitch from "./FeatureFlagSwitch";
import HypothesisConfig from "./HypothesisConfig";

function OptionsPage({}) {
    React.useEffect(() => {
        reportEventContentScript("openSettings");
    }, []);

    const [socialAnnotationsSupported, setSocialAnnotationsSupported] =
        React.useState(null);
    React.useEffect(async () => {
        const enabled = await getRemoteFeatureFlag(supportSocialAnnotations);
        setSocialAnnotationsSupported(enabled);
    }, []);

    const [hypothesisEnabled, setHypothesisEnabled] = React.useState(null);
    React.useEffect(async () => {
        const enabled = await getFeatureFlag(hypothesisSyncFeatureFlag);
        setHypothesisEnabled(enabled);
    }, []);
    function onChangeHypothesisSync(enabled) {
        setHypothesisEnabled(enabled);
    }

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
                {/* <p>Unclutter any article by clicking the extension icon.</p> */}
                <FeatureFlagSwitch featureFlagKey={enableBootUnclutterMessage}>
                    Show unclutter button on web pages{" "}
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
                    Show article outline where available
                </FeatureFlagSwitch>
            </OptionsGroup>

            <OptionsGroup
                headerText="Annotations"
                iconSvg={
                    <svg className="w-5" viewBox="0 0 576 512">
                        <path
                            fill="currentColor"
                            d="M127.1 248.3C127.1 233 135.2 218.7 147.5 209.6L420.6 8.398C428 2.943 436.1 0 446.2 0C457.6 0 468.5 4.539 476.6 12.62L531.4 67.38C539.5 75.46 543.1 86.42 543.1 97.84C543.1 107 541.1 115.1 535.6 123.4L334.4 396.5C325.3 408.8 310.1 416 295.7 416H223.1L198.6 441.4C186.1 453.9 165.9 453.9 153.4 441.4L102.6 390.6C90.13 378.1 90.13 357.9 102.6 345.4L127.1 320L127.1 248.3zM229 229L314.1 314.1L473.4 99.92L444.1 70.59L229 229zM140.7 473.9L109.7 504.1C105.2 509.5 99.05 512 92.69 512H24C10.75 512 0 501.3 0 488V483.3C0 476.1 2.529 470.8 7.029 466.3L70.06 403.3L140.7 473.9zM552 464C565.3 464 576 474.7 576 488C576 501.3 565.3 512 552 512H224C210.7 512 200 501.3 200 488C200 474.7 210.7 464 224 464H552z"
                        />
                    </svg>
                }
            >
                <p>
                    Highlight any article text to create a private annotation
                    saved locally.
                </p>
                <FeatureFlagSwitch
                    featureFlagKey={hypothesisSyncFeatureFlag}
                    onChange={onChangeHypothesisSync}
                >
                    Sync annotations with my{" "}
                    <a
                        href="https://web.hypothes.is"
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Hypothes.is
                    </a>{" "}
                    account
                </FeatureFlagSwitch>
                {hypothesisEnabled && <HypothesisConfig />}

                {socialAnnotationsSupported && (
                    <FeatureFlagSwitch
                        featureFlagKey={showSocialAnnotationsDefaultFeatureFlag}
                    >
                        Show social annotations by default
                    </FeatureFlagSwitch>
                )}
            </OptionsGroup>

            <OptionsGroup
                headerText="Automatic activation"
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
                    Collect{" "}
                    <a
                        href="https://github.com/lindylearn/unclutter/tree/main/docs/metrics.md"
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        anonymous statistics
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
