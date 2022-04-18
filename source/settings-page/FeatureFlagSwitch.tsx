import React from "react";
import { reportEventContentScript } from "source/content-script/messaging";
import {
    collectAnonymousMetricsFeatureFlag,
    getFeatureFlag,
    setFeatureFlag,
} from "../common/featureFlags";

// there's a weird bundling error on firefox when importing React, {useState}
// so use React.useState

export default function FeatureFlagSwitch({ featureFlagKey, children }) {
    const [state, setState] = React.useState(null);
    React.useEffect(async () => {
        const newState = await getFeatureFlag(featureFlagKey);
        setState(newState);
    }, []);
    async function toggleStateLocalFirst() {
        const newState = !state;
        setState(newState);

        await reportEventContentScript("changeSetting", {
            flag: featureFlagKey,
            state: newState ? "enabled" : "disabled",
        });
        if (
            featureFlagKey === collectAnonymousMetricsFeatureFlag &&
            !newState
        ) {
            // report that metrics were disabled before applying new config (after that reportEvent no-nops)
            await reportEventContentScript("disableMetrics");
        }

        setFeatureFlag(featureFlagKey, newState);
    }

    return (
        <div className="flex">
            <p className="mr-2">{children}</p>
            <div class="switch">
                <input
                    type="checkbox"
                    id={featureFlagKey}
                    class="switch__input"
                    checked={state}
                    onChange={toggleStateLocalFirst}
                />
                <label for={featureFlagKey} class="switch__label"></label>
            </div>
        </div>
    );
}
