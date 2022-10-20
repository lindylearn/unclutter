import React from "react";
import {
    collectAnonymousMetricsFeatureFlag,
    getFeatureFlag,
    setFeatureFlag,
} from "../common/featureFlags";
import { reportEventContentScript } from "@unclutter/library-components/dist/common/messaging";

// there's a weird bundling error on firefox when importing React, {useState}
// so use React.useState

export default function FeatureFlagSwitch({
    featureFlagKey,
    children,
    onChange = (enabled: boolean) => {},
}) {
    const [state, setState] = React.useState(null);
    React.useEffect(() => {
        (async function () {
            const newState = await getFeatureFlag(featureFlagKey);
            setState(newState);
        })();
    }, []);
    async function toggleStateLocalFirst() {
        const newState = !state;
        setState(newState);

        await reportEventContentScript("changeSetting", {
            flag: featureFlagKey,
            state: newState ? "enabled" : "disabled",
        });
        if (featureFlagKey === collectAnonymousMetricsFeatureFlag && !newState) {
            // report that metrics were disabled before applying new config (after that reportEvent no-nops)
            await reportEventContentScript("disableMetrics");
        }

        setFeatureFlag(featureFlagKey, newState);

        onChange(newState);
    }

    return (
        <div className="flex">
            <p className="mr-2">{children}</p>
            <div className="switch">
                <input
                    type="checkbox"
                    id={featureFlagKey}
                    className="switch__input"
                    checked={state}
                    onChange={toggleStateLocalFirst}
                />
                <label htmlFor={featureFlagKey} className="switch__label"></label>
            </div>
        </div>
    );
}
