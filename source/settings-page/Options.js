import React from "react";
import {
    allowlistDomainOnManualActivationFeatureFlag,
    automaticallyEnabledFeatureFlag,
    collectAnonymousMetricsFeatureFlag,
} from "../common/featureFlags";
import { reportEvent } from "../common/metrics";
import DomainSettingsList from "./DomainSettingsList";
import FeatureFlagSwitch from "./FeatureFlagSwitch";

function OptionsPage({}) {
    React.useEffect(() => {
        reportEvent("openSettings");
    }, []);

    return (
        <div className="flex flex-col gap-3 dark:text-white">
            <div>
                <h2 className="text-lg font-semibold mb-1">Global settings</h2>
                <FeatureFlagSwitch
                    featureFlagKey={automaticallyEnabledFeatureFlag}
                >
                    Automatically unclutter pages{" "}
                    <a
                        href="https://github.com/lindylearn/unclutter/tree/main/docs/article-detection.md"
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        that look like articles
                    </a>
                </FeatureFlagSwitch>
            </div>
            <div>
                <h2 className="text-lg font-semibold mb-1">
                    Domain-specific settings
                </h2>
                <DomainSettingsList />
                <FeatureFlagSwitch
                    featureFlagKey={
                        allowlistDomainOnManualActivationFeatureFlag
                    }
                >
                    Enable extension on the current domain when clicking the
                    extension icon
                </FeatureFlagSwitch>
                <p className="mt-2">
                    You can also change domain-specific settings by clicking the
                    "bolt" icon next to each article.
                </p>
            </div>
            <div>
                <h2 className="text-lg font-bold mb-1">Other</h2>
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
            </div>

            <div className="text-right text-gray-400 mt-5">
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
        </div>
    );
}
export default OptionsPage;
